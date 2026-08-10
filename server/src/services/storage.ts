import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    PutObjectCommand,
    UploadPartCommand,
} from "@aws-sdk/client-s3";
import Elysia, { t } from "elysia";
import path from "node:path";
import type { Env } from "../db/db";
import { setup } from "../setup";
import { getEnv } from "../utils/di";
import { createS3Client } from "../utils/s3";

function buf2hex(buffer: ArrayBuffer) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

// ---- File bed (通用文件托管) constants & helpers ----
// 单次分片请求体受 Cloudflare Worker 100MB 上限约束，这里留余量取 50MB
const PART_SIZE = 50 * 1024 * 1024;
// 业务上限：单文件最大 5GB
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
// 可安全内联预览的扩展名；其余一律 attachment（html/svg/js 等可执行内容强制下载，防存储型 XSS）
const INLINE_EXT = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'pdf', 'txt', 'md',
    'mp4', 'webm', 'mov', 'mp3', 'ogg', 'wav', 'flac',
]);
const EXT_MIME: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml',
    pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac',
    zip: 'application/zip', '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
    gz: 'application/gzip', json: 'application/json', xml: 'application/xml',
    js: 'text/javascript', css: 'text/css', html: 'text/html', htm: 'text/html',
};

function extOf(name: string): string {
    const dot = name.lastIndexOf('.');
    if (dot < 0 || dot === name.length - 1) return '';
    return name.slice(dot + 1).toLowerCase();
}

function mimeFor(name: string): string {
    return EXT_MIME[extOf(name)] || 'application/octet-stream';
}

function dispositionFor(name: string): string {
    const ext = extOf(name);
    if (INLINE_EXT.has(ext)) return 'inline';
    return 'attachment';
}

// 净化文件名：去路径分隔符/控制字符/前导点、截断，防路径穿越；为空则回退 "file"
function sanitizeFilename(name: string): string {
    const cleaned = String(name || '')
        .replace(/[\\/\p{Cc}]/gu, '')
        .replace(/^\.+/, '')
        .trim()
        .slice(0, 120);
    return cleaned || 'file';
}

// 格式化 S3 错误：记录错误码与 HTTP 状态，便于排查 R2/S3 兼容问题
function s3Err(e: any): string {
    const code = e?.code || e?.name || '';
    const status = e?.$metadata?.httpStatusCode;
    console.error('[storage]', { code, status, message: e?.message });
    return code ? `${e.message} (${code}${status ? `, HTTP ${status}` : ''})` : e.message;
}

export function StorageService() {
    const env: Env = getEnv();
    const endpoint = env.S3_ENDPOINT;
    const accessKeyId = env.S3_ACCESS_KEY_ID;
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
    const s3 = createS3Client();

    // 图片桶：图床 / 文章插图 / favicon
    const imgBucket = env.IMG_BUCKET;
    const imgFolder = env.IMG_FOLDER || '';
    const imgAccessHost = env.IMG_ACCESS_HOST || endpoint;
    // 文件桶：文件托管
    const fileBucket = env.FILE_BUCKET;
    const fileFolder = env.FILE_FOLDER || '';
    const fileAccessHost = env.FILE_ACCESS_HOST || endpoint;
    // 文件托管对象键前缀，统一使用 '/'（S3 key 语义），避免平台路径分隔符差异
    const filePrefix = fileFolder
        ? `${fileFolder.split('/').filter(Boolean).join('/')}/`
        : '';
    const s3Ready = (set: any): string => {
        if (!endpoint) { set.status = 500; return 'S3_ENDPOINT is not defined' }
        if (!accessKeyId) { set.status = 500; return 'S3_ACCESS_KEY_ID is not defined' }
        if (!secretAccessKey) { set.status = 500; return 'S3_SECRET_ACCESS_KEY is not defined' }
        return ''
    }
    return new Elysia({ aot: false })
        .use(setup())
        .group('/storage', (group) =>
            group
                .post('/', async ({ uid, set, body: { key, file } }) => {
                    const err = s3Ready(set)
                    if (err) return err
                    if (!imgBucket) { set.status = 500; return 'IMG_BUCKET is not defined' }
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    const suffix = key.includes(".") ? key.split('.').pop() : "";
                    const hashArray = await crypto.subtle.digest(
                        { name: 'SHA-1' },
                        await file.arrayBuffer()
                    );
                    const hash = buf2hex(hashArray)
                    const hashkey = path.join(imgFolder, hash + "." + suffix);
                    try {
                        const response = await s3.send(new PutObjectCommand({ Bucket: imgBucket, Key: hashkey, Body: file, ContentType: file.type }))
                        console.info(response);
                        return `${imgAccessHost}/${hashkey}`
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({
                        key: t.String(),
                        file: t.File()
                    })
                })
                .post('/img-bed', async ({ uid, set, body: { key, file } }) => {
                    const err = s3Ready(set)
                    if (err) return err
                    if (!imgBucket) { set.status = 500; return 'IMG_BUCKET is not defined' }
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    const suffix = key.includes(".") ? key.split('.').pop() : "";
                    const hashArray = await crypto.subtle.digest(
                        { name: 'SHA-1' },
                        await file.arrayBuffer()
                    );
                    const hash = buf2hex(hashArray)
                    const hashkey = path.join(imgFolder, 'img-bed', hash + "." + suffix);
                    try {
                        const response = await s3.send(new PutObjectCommand({ Bucket: imgBucket, Key: hashkey, Body: file, ContentType: file.type }))
                        console.info(response);
                        return `${imgAccessHost}/${hashkey}`
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({
                        key: t.String(),
                        file: t.File()
                    })
                })
                .post('/files/multipart', async ({ uid, set, body }) => {
                    const err = s3Ready(set)
                    if (err) return err
                    if (!fileBucket) { set.status = 500; return 'FILE_BUCKET is not defined' }
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    // folderId 只用于对象键的唯一目录；
                    // 真正的 uploadId 必须用 R2 在 CreateMultipartUpload 返回的 UploadId，
                    // 否则后续 UploadPart/Complete 会报 NoSuchUpload
                    const folderId = crypto.randomUUID()
                    const name = sanitizeFilename(body.key)
                    const key = `${filePrefix}${folderId}/${name}`
                    try {
                        const response = await s3.send(new CreateMultipartUploadCommand({
                            Bucket: fileBucket,
                            Key: key,
                            ContentType: mimeFor(name),
                            ContentDisposition: dispositionFor(name),
                        }))
                        console.info(response)
                        if (!response.UploadId) { set.status = 500; return 'Failed to get UploadId from R2' }
                        return { uploadId: response.UploadId, key }
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({ key: t.String() })
                })
                .put('/files/multipart/:uploadId/:partNumber', async ({ uid, set, params, body }) => {
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    const partNumber = parseInt(params.partNumber, 10)
                    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
                        set.status = 400; return 'Invalid part number'
                    }
                    // key 由 initiate 生成并回传，目录组件是 folderId 而非 uploadId；
                    // R2 会对 (bucket, key, uploadId) 三元组做校验，这里仅做基础前缀检查
                    if (!body.key.startsWith(filePrefix)) {
                        set.status = 400; return 'Invalid key'
                    }
                    if (body.file.size > PART_SIZE) {
                        set.status = 413; return `Part exceeds ${PART_SIZE} bytes`
                    }
                    try {
                        const response = await s3.send(new UploadPartCommand({
                            Bucket: fileBucket,
                            Key: body.key,
                            UploadId: params.uploadId,
                            PartNumber: partNumber,
                            Body: body.file,
                        }))
                        return { partNumber, etag: response.ETag }
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({
                        key: t.String(),
                        file: t.File()
                    })
                })
                .post('/files/multipart/:uploadId/complete', async ({ uid, set, params, body }) => {
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    // key 由 initiate 生成并回传，目录组件是 folderId 而非 uploadId；
                    // R2 会对 (bucket, key, uploadId) 三元组做校验，这里仅做基础前缀检查
                    if (!body.key.startsWith(filePrefix)) {
                        set.status = 400; return 'Invalid key'
                    }
                    if (!body.parts.length) { set.status = 400; return 'No parts' }
                    if (body.parts.length > 10000) { set.status = 400; return 'Too many parts' }
                    const total = body.parts.reduce((sum, p) => sum + p.size, 0)
                    if (total > MAX_FILE_SIZE) { set.status = 413; return 'File exceeds 5GB' }
                    const parts = [...body.parts]
                        .sort((a, b) => a.partNumber - b.partNumber)
                        .map(({ partNumber, etag }) => ({ PartNumber: partNumber, ETag: etag }))
                    try {
                        const response = await s3.send(new CompleteMultipartUploadCommand({
                            Bucket: fileBucket,
                            Key: body.key,
                            UploadId: params.uploadId,
                            MultipartUpload: { Parts: parts },
                        }))
                        console.info(response)
                        return `${fileAccessHost}/${body.key}`
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({
                        key: t.String(),
                        parts: t.Array(t.Object({
                            partNumber: t.Integer(),
                            etag: t.String(),
                            size: t.Integer()
                        }))
                    })
                })
                .delete('/files/multipart/:uploadId', async ({ uid, set, params, body }) => {
                    if (!uid) { set.status = 401; return 'Unauthorized' }
                    // key 由 initiate 生成并回传，目录组件是 folderId 而非 uploadId；
                    // R2 会对 (bucket, key, uploadId) 三元组做校验，这里仅做基础前缀检查
                    if (!body.key.startsWith(filePrefix)) {
                        set.status = 400; return 'Invalid key'
                    }
                    try {
                        await s3.send(new AbortMultipartUploadCommand({
                            Bucket: fileBucket,
                            Key: body.key,
                            UploadId: params.uploadId,
                        }))
                        return 'ok'
                    } catch (e: any) {
                        set.status = 400;
                        return s3Err(e)
                    }
                }, {
                    body: t.Object({ key: t.String() })
                })
        );
}