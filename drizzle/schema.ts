import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/*
|--------------------------------------------------------------------------
| STATUS DO ALIMENTADOR
|--------------------------------------------------------------------------
*/

export const feederStatus = pgTable("feeder_status", {
  id: serial("id").primaryKey(),

  meal1Completed: integer("meal1_completed").default(0),
  meal2Completed: integer("meal2_completed").default(0),
  meal3Completed: integer("meal3_completed").default(0),
  meal4Completed: integer("meal4_completed").default(0),
  meal5Completed: integer("meal5_completed").default(0),
  meal6Completed: integer("meal6_completed").default(0),

  currentTime: text("current_time"),

  isOnline: integer("is_online").default(0),

  lastUpdate: timestamp("last_update").defaultNow(),
});

/*
|--------------------------------------------------------------------------
| HISTÓRICO DE ALIMENTAÇÕES
|--------------------------------------------------------------------------
*/

export const feederHistory = pgTable("feeder_history", {
  id: serial("id").primaryKey(),

  mealNumber: integer("meal_number").notNull(),

  type: text("type").notNull(),

<<<<<<< Updated upstream
  timestamp: timestamp("timestamp").defaultNow(),
=======
/**
 * Histórico de alimentações (para sincronização com ESP8266)
 */
export const feedingHistory = mysqlTable("feeding_history", {
  id: int("id").autoincrement().primaryKey(),
  mealNumber: int("meal_number").notNull(), // 1 a 6
  type: mysqlEnum("type", ["manual", "automatic"]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedingHistory = typeof feedingHistory.$inferSelect;
export type InsertFeedingHistory = typeof feedingHistory.$inferInsert;

/**
 * Status atual do dispositivo ESP8266
 */
export const deviceStatus = mysqlTable("device_status", {
  id: int("id").autoincrement().primaryKey(),
  meal1Completed: int("meal1_completed").default(0).notNull(), // 0 ou 1
  meal2Completed: int("meal2_completed").default(0).notNull(), // 0 ou 1
  meal3Completed: int("meal3_completed").default(0).notNull(), // 0 ou 1
  meal4Completed: int("meal4_completed").default(0).notNull(), // 0 ou 1
  meal5Completed: int("meal5_completed").default(0).notNull(), // 0 ou 1
  meal6Completed: int("meal6_completed").default(0).notNull(), // 0 ou 1
  currentTime: varchar("current_time", { length: 64 }),
  nextMealTime: varchar("next_meal_time", { length: 64 }),
  isOnline: int("is_online").default(0).notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
>>>>>>> Stashed changes
});

/*
|--------------------------------------------------------------------------
| COMANDOS PENDENTES
|--------------------------------------------------------------------------
*/

<<<<<<< Updated upstream
export const pendingCommands = pgTable("pending_commands", {
  id: serial("id").primaryKey(),
=======
/**
 * Horários programados para alimentação
 */
export const feedingSchedules = mysqlTable("feeding_schedules", {
  id: int("id").autoincrement().primaryKey(),
  mealNumber: int("meal_number").notNull(), // 1 a 6
  hour: int("hour").notNull(),
  minute: int("minute").notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
>>>>>>> Stashed changes

  command: text("command").notNull(),

<<<<<<< Updated upstream
  createdAt: timestamp("created_at").defaultNow(),
=======
/**
 * Comandos pendentes para o ESP8266
 */
export const pendingCommands = mysqlTable("pending_commands", {
  id: int("id").autoincrement().primaryKey(),
  command: mysqlEnum("command", ["feed_meal_1", "feed_meal_2", "feed_meal_3", "feed_meal_4", "feed_meal_5", "feed_meal_6", "sync_status"]).notNull(),
  status: mysqlEnum("status", ["pending", "acknowledged", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
>>>>>>> Stashed changes
});
