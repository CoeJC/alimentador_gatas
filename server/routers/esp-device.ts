import { z } from "zod";
import { router, publicProcedure } from "../trpc";

type FeedingHistory = {
  id: number;
  mealNumber: number;
  type: string;
  timestamp: string;
};

let feedingHistory: FeedingHistory[] = [];

let pendingCommand: string | null = null;

let deviceStatus = {
  completedMeals: [] as number[],
  currentTime: "--:--",
  isOnline: 0,
  lastUpdate: null as string | null,
};

export const espDeviceRouter = router({

  // =====================================================
  // STATUS
  // =====================================================

  getStatus: publicProcedure.query(() => {
    return {
      success: true,
      data: deviceStatus,
    };
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        completedMeals: z.array(z.number()).default([]),
        currentTime: z.string(),
        isOnline: z.number(),
      })
    )
    .mutation(({ input }) => {

      deviceStatus = {
        completedMeals: input.completedMeals,
        currentTime: input.currentTime,
        isOnline: input.isOnline,
        lastUpdate: new Date().toISOString(),
      };

      return {
        success: true,
      };
    }),

  // =====================================================
  // HISTÓRICO
  // =====================================================

  getHistory: publicProcedure.query(() => {
    return {
      success: true,
      data: feedingHistory,
    };
  }),

  recordFeeding: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
        type: z.string(),
      })
    )
    .mutation(({ input }) => {

      feedingHistory.push({
        id: Date.now(),
        mealNumber: input.mealNumber,
        type: input.type,
        timestamp: new Date().toISOString(),
      });

      // marca refeição como concluída
      if (
        !deviceStatus.completedMeals.includes(input.mealNumber)
      ) {
        deviceStatus.completedMeals.push(input.mealNumber);
      }

      return {
        success: true,
      };
    }),

  // =====================================================
  // COMANDO MANUAL
  // =====================================================

  feedManual: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
      })
    )
    .mutation(({ input }) => {

      pendingCommand = `feed_meal_${input.mealNumber}`;

      return {
        success: true,
      };
    }),

  // =====================================================
  // ESP POLLING
  // =====================================================

  getPendingCommand: publicProcedure.query(() => {

    if (!pendingCommand) {
      return {
        success: true,
        data: null,
      };
    }

    const command = pendingCommand;

    pendingCommand = null;

    return {
      success: true,
      data: {
        type: command,
        timestamp: new Date().toISOString(),
      },
    };
  }),

  // =====================================================
  // RESET DIA
  // =====================================================

  resetMeals: publicProcedure.mutation(() => {

    deviceStatus.completedMeals = [];

    return {
      success: true,
    };
  }),
});
