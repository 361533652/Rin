ALTER TABLE `feeds` ADD COLUMN `cover` text;
-->statement-breakpoint
UPDATE `info` SET `value` = '6' WHERE `key` = 'migration_version';
