import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, deviceStatus, feedingSessions, feedingSchedules, InsertDeviceStatus, pendingCommands, InsertPendingCommand } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateDeviceStatus() {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(deviceStatus).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(deviceStatus).values({
    completedMeals: [],
    isOnline: 0,
  });

  const result = await db.select().from(deviceStatus).limit(1);
  return result[0];
}

export async function updateDeviceStatus(data: Partial<InsertDeviceStatus>) {
  const db = await getDb();
  if (!db) return undefined;

  const status = await getOrCreateDeviceStatus();
  if (!status) return undefined;

  await db.update(deviceStatus).set(data).where(eq(deviceStatus.id, status.id));
  const result = await db.select().from(deviceStatus).where(eq(deviceStatus.id, status.id)).limit(1);
  return result[0];
}

export async function addFeedingSession(type: 'manual' | 'automatic', mealNumber: number) {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(feedingSessions).values({
    type,
    mealNumber,
  });
}

export async function getFeedingHistory(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(feedingSessions).orderBy(feedingSessions.id).limit(limit);
}

export async function getFeedingSchedules() {
  const db = await getDb();
  if (!db) return [];

  const schedules = await db.select().from(feedingSchedules).orderBy((t) => t.mealNumber);
  // Ensure we have both meals
  if (schedules.length === 0) {
    await updateFeedingSchedule(1, 3, 18);
    await updateFeedingSchedule(2, 3, 19);
    return getFeedingSchedules();
  }
  return schedules;
}

export async function updateFeedingSchedule(mealNumber: number, hour: number, minute: number) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(feedingSchedules).where(eq(feedingSchedules.mealNumber, mealNumber));
  
  if (existing.length > 0) {
    await db.update(feedingSchedules).set({ hour, minute }).where(eq(feedingSchedules.mealNumber, mealNumber));
  } else {
    await db.insert(feedingSchedules).values({ mealNumber, hour, minute });
  }
}

export async function createPendingCommand(command: 'feed_meal_1' | 'feed_meal_2' | 'sync_status') {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(pendingCommands).values({ command });
  return result;
}

export async function getPendingCommands(limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pendingCommands).where(eq(pendingCommands.status, 'pending')).limit(limit);
}

export async function acknowledgeCommand(commandId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db.update(pendingCommands).set({ status: 'acknowledged', acknowledgedAt: new Date() }).where(eq(pendingCommands.id, commandId));
}

export async function completeCommand(commandId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db.update(pendingCommands).set({ status: 'completed', completedAt: new Date() }).where(eq(pendingCommands.id, commandId));
}

// TODO: add feature queries here as your schema grows.
