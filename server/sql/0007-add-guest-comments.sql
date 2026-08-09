-- 访客评论：comments.user_id 可空，新增 email 列（访客身份，仅用于生成头像，不公开）
-->statement-breakpoint
CREATE TABLE `comments_new` (
	`id` integer PRIMARY KEY,
	`feed_id` integer NOT NULL REFERENCES `feeds`(`id`) ON DELETE CASCADE,
	`user_id` integer REFERENCES `users`(`id`) ON DELETE CASCADE,
	`email` text,
	`content` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
-->statement-breakpoint
INSERT INTO `comments_new` (`id`, `feed_id`, `user_id`, `content`, `created_at`, `updated_at`)
SELECT `id`, `feed_id`, `user_id`, `content`, `created_at`, `updated_at` FROM `comments`;
-->statement-breakpoint
DROP TABLE `comments`;
-->statement-breakpoint
ALTER TABLE `comments_new` RENAME TO `comments`;
-->statement-breakpoint
UPDATE `info` SET `value` = '7' WHERE `key` = 'migration_version';
