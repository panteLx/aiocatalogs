CREATE TABLE `t3-cloudflare_user_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `t3-cloudflare_user_configs_user_id_unique` ON `t3-cloudflare_user_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `t3-cloudflare_user_configs` (`user_id`);