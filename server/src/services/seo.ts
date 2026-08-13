import Elysia from "elysia";
import path from "node:path";
import type { Env } from "../db/db";
import { getEnv } from "../utils/di";

export function SEOService() {
    const env: Env = getEnv();
    const endpoint = env.S3_ENDPOINT;
    const accessHost = env.CACHE_ACCESS_HOST || endpoint;
    const folder = env.CACHE_FOLDER || 'cache/';
    return new Elysia({ aot: false })
        .get('/seo/*', async ({ set, params, query }) => {
            if (!accessHost) {
                set.status = 500;
                return 'CACHE_ACCESS_HOST is not defined'
            }
            let url = params['*'];
            // query concat
            for (const key in query) {
                url += `&${key}=${query[key]}`;
            }
            if (url.endsWith('/') || url === '') {
                url += 'index.html';
            }
            const key = path.join(folder, url);
            try {
                const url = `${accessHost}/${key}`;
                console.log(`Fetching ${url}`);
                const response = await fetch(new Request(url))
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                        'Content-Type': 'text/html; charset=UTF-8',
                        // 预渲染 HTML 每小时过期一次：文章增删/改名后边缘缓存最多滞后 1h，
                        // 配合每日 SEO cron 全量重爬，避免爬虫长时间看到陈旧内容
                        'Cache-Control': 'public, max-age=3600',
                    },
                });
            } catch (e: any) {
                console.error(e);
                set.status = 500;
                return e.message;
            }
        })
}
