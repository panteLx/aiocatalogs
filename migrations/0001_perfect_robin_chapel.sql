CREATE TABLE `cloudflare_api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`service` text NOT NULL,
	`key_name` text NOT NULL,
	`key_value` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cloudflare_shared_catalogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`share_id` text NOT NULL,
	`shared_by_user_id` text NOT NULL,
	`catalog_ids` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_key_user_id_idx` ON `cloudflare_api_keys` (`user_id`);--> statement-breakpoint
CREATE INDEX `api_key_service_idx` ON `cloudflare_api_keys` (`user_id`,`service`);--> statement-breakpoint
CREATE INDEX `unique_user_service_key_idx` ON `cloudflare_api_keys` (`user_id`,`service`,`key_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `cloudflare_shared_catalogs_share_id_unique` ON `cloudflare_shared_catalogs` (`share_id`);--> statement-breakpoint
CREATE INDEX `share_id_idx` ON `cloudflare_shared_catalogs` (`share_id`);--> statement-breakpoint
CREATE INDEX `shared_by_user_id_idx` ON `cloudflare_shared_catalogs` (`shared_by_user_id`);