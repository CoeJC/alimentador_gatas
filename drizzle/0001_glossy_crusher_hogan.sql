CREATE TABLE `device_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal1_completed` int NOT NULL DEFAULT 0,
	`meal2_completed` int NOT NULL DEFAULT 0,
	`current_time` varchar(64),
	`next_meal_time` varchar(64),
	`is_online` int NOT NULL DEFAULT 0,
	`last_heartbeat` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `device_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeding_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_number` int NOT NULL,
	`hour` int NOT NULL,
	`minute` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feeding_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeding_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('manual','automatic') NOT NULL,
	`meal_number` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feeding_sessions_id` PRIMARY KEY(`id`)
);
