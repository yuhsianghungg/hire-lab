CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_id_idx` ON `order_status_history` (`order_id`);
--> statement-breakpoint
INSERT INTO `order_status_history` (`id`,`order_id`,`status`,`created_by`,`note`,`created_at`)
SELECT lower(hex(randomblob(16))),o.id,'pending',o.user_id,'既有訂單匯入',o.created_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id=o.id);
--> statement-breakpoint
INSERT INTO `order_status_history` (`id`,`order_id`,`status`,`created_by`,`note`,`created_at`)
SELECT lower(hex(randomblob(16))),o.id,o.status,o.user_id,'既有訂單目前狀態',o.updated_at
FROM orders o
WHERE o.status<>'pending'
  AND NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id=o.id AND h.status=o.status);
