CREATE TABLE `audit_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `actor_id` text NOT NULL,
  `action` text NOT NULL,
  `resource_type` text NOT NULL,
  `resource_id` text NOT NULL,
  `details` text,
  `created_at` text NOT NULL
);
