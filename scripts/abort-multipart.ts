// 列出 / 中止指定 bucket 中所有「进行中的 multipart 上传」（清理孤儿上传）
//
// 用法：
//   1) 可选：在仓库根目录建 .env（已被 gitignore），填：
//      S3_REGION=auto
//      S3_ENDPOINT=<endpoint>
//      S3_ACCESS_KEY_ID=<key>
//      S3_SECRET_ACCESS_KEY=<secret>
//      FILE_BUCKET=<bucket>
//   2) 干跑（只列出，不删）：bun scripts/abort-multipart.ts --list
//   3) 真正清理：          bun scripts/abort-multipart.ts
import {
    AbortMultipartUploadCommand,
    ListMultipartUploadsCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import fs from "node:fs";

// 简单读取根目录 .env（若存在），不覆盖已设置的 process.env
function loadDotEnv() {
    try {
        const content = fs.readFileSync(".env", "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq < 0) continue;
            const k = trimmed.slice(0, eq).trim();
            const v = trimmed.slice(eq + 1).trim();
            if (!(k in process.env)) process.env[k] = v;
        }
    } catch { /* 没有 .env 就用环境变量 */ }
}
loadDotEnv();

const listOnly = process.argv.includes("--list");
const env = process.env;
const region = env.S3_REGION;
const endpoint = env.S3_ENDPOINT;
const accessKeyId = env.S3_ACCESS_KEY_ID;
const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
const bucket = env.FILE_BUCKET || env.CACHE_BUCKET || "";
const forcePathStyle = env.S3_FORCE_PATH_STYLE === "true";

for (const [name, value] of Object.entries({ S3_REGION: region, S3_ENDPOINT: endpoint, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secretAccessKey, bucket })) {
    if (!value) throw new Error(`${name} is not defined`);
}

const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
});

let total = 0;
let keyMarker: string | undefined;
let uploadIdMarker: string | undefined;
let truncated = true;

while (truncated) {
    const res = await s3.send(new ListMultipartUploadsCommand({
        Bucket: bucket,
        KeyMarker: keyMarker,
        UploadIdMarker: uploadIdMarker,
    }));
    for (const upload of res.Uploads || []) {
        if (!upload.Key || !upload.UploadId) continue;
        console.log(`${upload.Key} | uploadId ${upload.UploadId} | initiated ${upload.Initiated}`);
        if (!listOnly) {
            await s3.send(new AbortMultipartUploadCommand({
                Bucket: bucket,
                Key: upload.Key,
                UploadId: upload.UploadId,
            }));
            total++;
        }
    }
    truncated = res.IsTruncated === true;
    keyMarker = res.NextKeyMarker;
    uploadIdMarker = res.NextUploadIdMarker;
}

if (listOnly) {
    console.log(`Done. Listed in-progress multipart upload(s) in bucket "${bucket}" (not aborted, --list).`);
} else {
    console.log(`Done. Aborted ${total} in-progress multipart upload(s) in bucket "${bucket}".`);
}
