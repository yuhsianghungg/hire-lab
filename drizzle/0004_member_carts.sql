CREATE TABLE `carts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `reminder_opt_in` integer DEFAULT 0 NOT NULL,
  `last_reminded_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carts_user_id_unique` ON `carts` (`user_id`);
--> statement-breakpoint
CREATE TABLE `cart_items` (
  `id` text PRIMARY KEY NOT NULL,
  `cart_id` text NOT NULL,
  `item_key` text NOT NULL,
  `slug` text NOT NULL,
  `name` text NOT NULL,
  `price` integer NOT NULL,
  `color` text NOT NULL,
  `color_name` text NOT NULL,
  `quantity` integer NOT NULL,
  FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_items_cart_key_unique` ON `cart_items` (`cart_id`,`item_key`);
--> statement-breakpoint
CREATE TABLE `cart_reminders` (
  `id` text PRIMARY KEY NOT NULL,
  `cart_id` text NOT NULL,
  `channel` text DEFAULT 'in_app' NOT NULL,
  `status` text DEFAULT 'shown' NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cart_reminders_cart_id_index` ON `cart_reminders` (`cart_id`);
