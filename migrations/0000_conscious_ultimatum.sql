CREATE TABLE `cloudflare_catalogs` (
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
CREATE TABLE `cloudflare_user_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `catalog_user_id_idx` ON `cloudflare_catalogs` (`user_id`);--> statement-breakpoint
CREATE INDEX `catalog_order_idx` ON `cloudflare_catalogs` (`user_id`,`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `cloudflare_user_configs_user_id_unique` ON `cloudflare_user_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `cloudflare_user_configs` (`user_id`);