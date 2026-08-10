// 中止指定 bucket 中所有「进行中的 multipart 上传」（清理孤儿上传）
// 用法：
//   S3_REGION=auto S3_ENDPOINT=<endpoint> S3_ACCESS_KEY_ID=<id> S3_SECRET_ACCESS_KEY=<secret> \
//   FILE_BUCKET=<bucket> bun scripts/abort-multipart.ts
import {
    AbortMultipartUploadCommand,
    ListMultipartUploadsCommand,
    S3Client,
} from "@aws-sdk/client-s3";

const env = process.env;
const region = env.S3_REGION;
const endpoint = env.S3_ENDPOINT;
const accessKeyId = env.S3_ACCESS_KEY_ID;
const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
const bucket = env.FILE_BUCKET || env.CACHE_BUCKET || '';
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
        console.log(`Aborting ${upload.Key} (uploadId ${upload.UploadId}, initiated ${upload.Initiated})`);
        await s3.send(new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: upload.Key,
            UploadId: upload.UploadId,
        }));
        total++;
    }
    truncated = res.IsTruncated === true;
    keyMarker = res.NextKeyMarker;
    uploadIdMarker = res.NextUploadIdMarker;
}

console.log(`Done. Aborted ${total} in-progress multipart upload(s) in bucket "${bucket}".`);
