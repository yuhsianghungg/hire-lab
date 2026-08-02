ALTER TABLE `orders` ADD `quote_id` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_quote_id_unique` ON `orders` (`quote_id`) WHERE `quote_id` IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_number` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`shipping_fee` integer DEFAULT 0 NOT NULL,
	`deposit_amount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`expires_at` text,
	`sent_at` text,
	`accepted_at` text,
	`revision_note` text,
	`order_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_quote_number_unique` ON `quotes` (`quote_number`);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_order_id_unique` ON `quotes` (`order_id`);
--> statement-breakpoint
CREATE INDEX `quotes_user_id_idx` ON `quotes` (`user_id`);
--> statement-breakpoint
CREATE INDEX `quotes_status_idx` ON `quotes` (`status`);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`item_name` text NOT NULL,
	`specifications` text,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_items_quote_id_idx` ON `quote_items` (`quote_id`);
