import { describe, expect, it, mock } from 'bun:test';
import 'reflect-metadata';

const sent: any[] = [];
mock.module('./src/utils/s3.ts', () => ({
    createS3Client: () => ({
        send: async (cmd: any) => {
            const name = cmd.constructor?.name;
            sent.push({ name, key: cmd.input?.Key, uploadId: cmd.input?.UploadId, part: cmd.input?.PartNumber });
            if (name === 'CreateMultipartUploadCommand') return { UploadId: 'R2-REAL-UPLOAD-ID' };
            if (name === 'UploadPartCommand') return { ETag: '"etag-abc"' };
            return { Location: 'http://localhost/x' };
        }
    })
}));

const { app } = await import('./src/server');
import Container from 'typedi';
import { dbToken, envToken } from './src/utils/di';

process.env.NODE_ENV = 'test';
Container.set(envToken, {
    DB: {}, RIN_GITHUB_CLIENT_ID: 'f', RIN_GITHUB_CLIENT_SECRET: 'f',
    GITHUB_CLIENT_ID: '', GITHUB_CLIENT_SECRET: '', JWT_SECRET: 'f',
    FRONTEND_URL: 'http://localhost:5173', S3_REGION: 'auto',
    S3_ENDPOINT: 'http://127.0.0.1:9', S3_ACCESS_KEY_ID: 'f', S3_SECRET_ACCESS_KEY: 'f',
    S3_FORCE_PATH_STYLE: 'true', WEBHOOK_URL: '', WEATHER_API_KEY: '',
    RSS_TITLE: '', RSS_DESCRIPTION: '',
    IMG_BUCKET: 'image', IMG_FOLDER: 'images/', IMG_ACCESS_HOST: 'http://img.local',
    FILE_BUCKET: 'file', FILE_FOLDER: 'files/', FILE_ACCESS_HOST: 'http://file.local',
    CACHE_BUCKET: 'cache', CACHE_FOLDER: 'cache/', CACHE_ACCESS_HOST: 'http://cache.local',
});
Container.set(dbToken, {});

const server = app();
const AUTH = { authorization: 'Bearer {"uid":1}' };
const B = 'http://localhost';

describe('multipart upload flow', () => {
    it('returns real R2 UploadId and reuses it for UploadPart/Complete', async () => {
        // 1. initiate
        const f = new FormData();
        f.append('key', 'hello.txt');
        const r1 = await server.handle(new Request(`${B}/storage/files/multipart`, { method: 'POST', headers: AUTH, body: f }));
        expect(r1.status).toBe(200);
        const init = JSON.parse(await r1.text());
        console.log('initiate ->', init);

        // 关键断言：返回的是 R2 的 UploadId，而不是随机 UUID
        expect(init.uploadId).toBe('R2-REAL-UPLOAD-ID');
        // key 目录组件是 folderId（随机），与 uploadId 不同
        expect(init.key.startsWith('files/')).toBe(true);
        expect(init.key.endsWith('/hello.txt')).toBe(true);

        // 2. uploadPart（用返回的 uploadId + key）
        const pf = new FormData();
        pf.append('key', init.key);
        pf.append('file', new Blob(['hello']), 'p1');
        const r2 = await server.handle(new Request(`${B}/storage/files/multipart/${init.uploadId}/1`, { method: 'PUT', headers: AUTH, body: pf }));
        expect(r2.status).toBe(200);
        const part = JSON.parse(await r2.text());
        expect(part.partNumber).toBe(1);

        // 3. complete
        const comp = JSON.stringify({ key: init.key, parts: [{ partNumber: 1, etag: '"etag-abc"', size: 5 }] });
        const r3 = await server.handle(new Request(`${B}/storage/files/multipart/${init.uploadId}/complete`, { method: 'POST', headers: { ...AUTH, 'content-type': 'application/json' }, body: comp }));
        expect(r3.status).toBe(200);
        expect(await r3.text()).toBe(`http://file.local/${init.key}`);

        // 4. 验证传给 SDK 的 UploadId 都是 R2 的真实 id
        const uploadParts = sent.filter(s => s.name === 'UploadPartCommand');
        expect(uploadParts.length).toBe(1);
        expect(uploadParts[0].uploadId).toBe('R2-REAL-UPLOAD-ID');
        expect(uploadParts[0].key).toBe(init.key);
        const completes = sent.filter(s => s.name === 'CompleteMultipartUploadCommand');
        expect(completes[0].uploadId).toBe('R2-REAL-UPLOAD-ID');
        expect(completes[0].key).toBe(init.key);
    });
});
