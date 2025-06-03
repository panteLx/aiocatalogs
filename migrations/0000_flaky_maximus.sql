CREATE TABLE `t3-cloudflare_catalogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`manifest_url` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`original_manifest` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`randomized` integer DEFAULT false NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `t3-cloudflare_user_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `catalog_user_id_idx` ON `t3-cloudflare_catalogs` (`user_id`);--> statement-breakpoint
CREATE INDEX `catalog_order_idx` ON `t3-cloudflare_catalogs` (`user_id`,`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `t3-cloudflare_user_configs_user_id_unique` ON `t3-cloudflare_user_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `t3-cloudflare_user_configs` (`user_id`);