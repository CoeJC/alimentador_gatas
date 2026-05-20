import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/*
|--------------------------------------------------------------------------
| HISTÓRICO DE ALIMENTAÇÃO
|--------------------------------------------------------------------------
*/

export const feederHistory = pgTable("feeder_history", {
  id: serial("id").primaryKey(),

  mealNumber: integer("meal_number").notNull(),

  type: text("type").notNull(),

  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

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
