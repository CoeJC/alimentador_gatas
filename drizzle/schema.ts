import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Histórico de alimentações realizadas
 */
export const feedingSessions = mysqlTable("feeding_sessions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["manual", "automatic"]).notNull(),
  mealNumber: int("meal_number").notNull(), // 1 ou 2
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedingSession = typeof feedingSessions.$inferSelect;
export type InsertFeedingSession = typeof feedingSessions.$inferInsert;

/**
 * Status atual do dispositivo ESP8266
 */
export const deviceStatus = mysqlTable("device_status", {
  id: int("id").autoincrement().primaryKey(),
  completedMeals: text("completed_meals").default("[]"),
  currentTime: varchar("current_time", { length: 64 }),
  nextMealTime: varchar("next_meal_time", { length: 64 }),
  isOnline: int("is_online").default(0).notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeviceStatus = typeof deviceStatus.$inferSelect;
export type InsertDeviceStatus = typeof deviceStatus.$inferInsert;

/**
 * Horários programados para alimentação
 */
export const feedingSchedules = mysqlTable("feeding_schedules", {
  id: int("id").autoincrement().primaryKey(),
  mealNumber: int("meal_number").notNull(), // 1 ou 2
  hour: int("hour").notNull(),
  minute: int("minute").notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedingSchedule = typeof feedingSchedules.$inferSelect;
export type InsertFeedingSchedule = typeof feedingSchedules.$inferInsert;

/**
 * Comandos pendentes para o ESP8266
 */
export const pendingCommands = mysqlTable("pending_commands", {
  id: int("id").autoincrement().primaryKey(),
  command: mysqlEnum("command", ["feed_meal_1", "feed_meal_2", "sync_status"]).notNull(),
  status: mysqlEnum("status", ["pending", "acknowledged", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
});

export type PendingCommand = typeof pendingCommands.$inferSelect;
export type InsertPendingCommand = typeof pendingCommands.$inferInsert;
