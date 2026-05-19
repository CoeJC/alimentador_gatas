CREATE TABLE `pending_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command` enum('feed_meal_1','feed_meal_2','sync_status') NOT NULL,
	`status` enum('pending','acknowledged','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledged_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `pending_commands_id` PRIMARY KEY(`id`)
);
