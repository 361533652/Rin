import { desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import type { DB } from "../_worker";
import type { Env } from "../db/db";
import { comments, feeds, users } from "../db/schema";
import { setup } from "../setup";
import { ServerConfig } from "../utils/cache";
import { Config } from "../utils/config";
import { getDB, getEnv } from "../utils/di";
import { notify } from "../utils/webhook";

async function md5Hex(input: string): Promise<string> {
    const digest = await crypto.subtle.digest('MD5', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CommentService() {
    const db: DB = getDB();
    const env: Env = getEnv();
    return new Elysia({ aot: false })
        .use(setup())
        .group('/feed/comment', (group) =>
            group
                .get('/:feed', async ({ params: { feed } }) => {
                    const feedId = parseInt(feed);
                    const comment_list = await db.query.comments.findMany({
                        where: eq(comments.feedId, feedId),
                        with: {
                            user: {
                                columns: { id: true, username: true, avatar: true, permission: true }
                            }
                        },
                        orderBy: [desc(comments.createdAt)]
                    });
                    return await Promise.all(comment_list.map(async (c) => ({
                        id: c.id,
                        content: c.content,
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                        user: c.user,
                        guestId: c.email ? await md5Hex(c.email) : undefined,
                        nickname: c.email ? c.email.split('@')[0] : undefined,
                    })));
                })
                .post('/:feed', async ({ uid, set, params: { feed }, body: { content, email } }) => {
                    if (!content) {
                        set.status = 400;
                        return 'Content is required';
                    }
                    const feedId = parseInt(feed);
                    const exist = await db.query.feeds.findFirst({ where: eq(feeds.id, feedId) });
                    if (!exist) {
                        set.status = 400;
                        return 'Feed not found';
                    }

                    let userId: number | null = null;
                    let displayName = '';
                    if (uid) {
                        const user = await db.query.users.findFirst({ where: eq(users.id, parseInt(uid)) });
                        if (!user) {
                            set.status = 400;
                            return 'User not found';
                        }
                        userId = user.id;
                        displayName = user.username;
                    } else {
                        if (!email) {
                            set.status = 400;
                            return 'Email is required';
                        }
                        if (!isValidEmail(email)) {
                            set.status = 400;
                            return 'Invalid email';
                        }
                        displayName = email.split('@')[0];
                    }

                    await db.insert(comments).values({
                        feedId,
                        userId,
                        email: email ?? null,
                        content
                    });

                    const webhookUrl = await ServerConfig().get(Config.webhookUrl) || env.WEBHOOK_URL;
                    // notify
                    await notify(webhookUrl, `${env.FRONTEND_URL}/feed/${feedId}\n${displayName} 评论了: ${exist.title}\n${content}`);
                    return 'OK';
                }, {
                    body: t.Object({
                        content: t.String(),
                        email: t.Optional(t.String())
                    })
                })
        )
        .group('/comment', (group) =>
            group
                .delete('/:id', async ({ uid, admin, set, params: { id } }) => {
                    if (uid === undefined) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                    const id_num = parseInt(id);
                    const comment = await db.query.comments.findFirst({ where: eq(comments.id, id_num) });
                    if (!comment) {
                        set.status = 404;
                        return 'Not found';
                    }
                    if (!admin && comment.userId !== parseInt(uid)) {
                        set.status = 403;
                        return 'Permission denied';
                    }
                    await db.delete(comments).where(eq(comments.id, id_num));
                    return 'OK';
                })
        );
}