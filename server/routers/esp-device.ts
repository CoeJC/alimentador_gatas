import { z } from "zod";
import { router, publicProcedure } from "../trpc";

let pendingCommand: any = null;

let deviceStatus = {
  meal1Completed: 0,
  meal2Completed: 0,
  meal3Completed: 0,
  meal4Completed: 0,
  meal5Completed: 0,
  meal6Completed: 0,
  currentTime: "--:--",
  isOnline: 0,
  lastUpdate: null as Date | null,
};

let feedingHistory: any[] = [];

export const espDeviceRouter = router({

  // =========================
  // STATUS
  // =========================
  getStatus: publicProcedure.query(() => {
    return {
      success: true,
      data: deviceStatus,
    };
  }),

  // =========================
  // UPDATE STATUS
  // =========================
  updateStatus: publicProcedure
    .input(
      z.object({
        meal1Completed: z.number(),
        meal2Completed: z.number(),
        meal3Completed: z.number(),
        meal4Completed: z.number(),
        meal5Completed: z.number(),
        meal6Completed: z.number(),
        currentTime: z.string(),
        isOnline: z.number(),
      })
    )
    .mutation(({ input }) => {

      deviceStatus = {
        ...input,
        lastUpdate: new Date(),
      };

      return {
        success: true,
      };
    }),

  // =========================
  // FEED MANUAL
  // =========================
  feedManual: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
      })
    )
    .mutation(({ input }) => {

      pendingCommand = {
        type: `feed_meal_${input.mealNumber}`,
        timestamp: new Date(),
      };

      return {
        success: true,
      };
    }),

  // =========================
  // GET PENDING COMMAND
  // =========================
  getPendingCommand: publicProcedure.query(() => {

    const command = pendingCommand;

    pendingCommand = null;

    return {
      success: true,
      data: command,
    };
  }),

  // =========================
  // RECORD FEEDING
  // =========================
  recordFeeding: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
        type: z.string(),
      })
    )
    .mutation(({ input }) => {

      const newRecord = {
        id: Date.now(),
        mealNumber: input.mealNumber,
        type: input.type,
        timestamp: new Date(),
      };

      feedingHistory.push(newRecord);

      // mantém apenas os últimos 100 registros
      if (feedingHistory.length > 100) {
        feedingHistory.shift();
      }

      return {
        success: true,
        data: newRecord,
      };
    }),

  // =========================
  // HISTORY
  // =========================
  getHistory: publicProcedure.query(() => {

    return {
      success: true,
      data: feedingHistory,
    };
  }),
});
