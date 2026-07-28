CREATE TABLE `orders` (
  `id` text PRIMARY KEY NOT NULL,
  `order_number` text NOT NULL,
  `user_id` text NOT NULL,
  `item_summary` text NOT NULL,
  `total` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `tracking_number` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);
