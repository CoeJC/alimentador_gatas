CREATE TABLE `feeding_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_number` int NOT NULL,
	`type` enum('manual','automatic') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feeding_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pending_commands` MODIFY COLUMN `command` enum('feed_meal_1','feed_meal_2','feed_meal_3','feed_meal_4','feed_meal_5','feed_meal_6','sync_status') NOT NULL;--> statement-breakpoint
ALTER TABLE `device_status` ADD `meal3_completed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `device_status` ADD `meal4_completed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `device_status` ADD `meal5_completed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `device_status` ADD `meal6_completed` int DEFAULT 0 NOT NULL;