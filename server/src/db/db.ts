import { drizzle } from 'drizzle-orm/d1';

export interface Env {
    DB: D1Database;
    RIN_GITHUB_CLIENT_ID: string;
    RIN_GITHUB_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    JWT_SECRET: string;
    FRONTEND_URL: string;
    S3_REGION: string,
    S3_ENDPOINT: string,
    S3_ACCESS_KEY_ID: string,
    S3_SECRET_ACCESS_KEY: string,
    IMG_BUCKET: string,
    IMG_FOLDER: string,
    IMG_ACCESS_HOST: string,
    FILE_BUCKET: string,
    FILE_FOLDER: string,
    FILE_ACCESS_HOST: string,
    CACHE_BUCKET: string,
    CACHE_FOLDER: string,
    CACHE_ACCESS_HOST: string,
    WEBHOOK_URL: string,
    S3_FORCE_PATH_STYLE: string,
    WEATHER_API_KEY: string,

    RSS_TITLE: string,
    RSS_DESCRIPTION: string,
}

export function db(env: Env) {
    return drizzle(env.DB);
}
export default db;