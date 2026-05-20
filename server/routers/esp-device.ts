import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import {
  deviceStatus,
  feedingHistory,
  pendingCommands,
} from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

/*
|--------------------------------------------------------------------------
| ESP DEVICE ROUTER
|--------------------------------------------------------------------------
*/

export const espDeviceRouter = router({

  /*
  |--------------------------------------------------------------------------
  | STATUS DO DISPOSITIVO
  |--------------------------------------------------------------------------
  */

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
    .mutation(async ({ input }) => {

      const existing = await db
        .select()
        .from(deviceStatus)
        .limit(1);

      if (existing.length === 0) {

        await db.insert(deviceStatus).values({
          meal1Completed: input.meal1Completed,
          meal2Completed: input.meal2Completed,
          meal3Completed: input.meal3Completed,
          meal4Completed: input.meal4Completed,
          meal5Completed: input.meal5Completed,
          meal6Completed: input.meal6Completed,

          currentTime: input.currentTime,

          isOnline: input.isOnline,

          lastUpdate: new Date(),
        });

      } else {

        await db
          .update(deviceStatus)
          .set({
            meal1Completed: input.meal1Completed,
            meal2Completed: input.meal2Completed,
            meal3Completed: input.meal3Completed,
            meal4Completed: input.meal4Completed,
            meal5Completed: input.meal5Completed,
            meal6Completed: input.meal6Completed,

            currentTime: input.currentTime,

            isOnline: input.isOnline,

            lastUpdate: new Date(),
          })
          .where(eq(deviceStatus.id, existing[0].id));
      }

      return {
        success: true,
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | OBTER STATUS
  |--------------------------------------------------------------------------
  */

  getStatus: publicProcedure
    .query(async () => {

      const status = await db
        .select()
        .from(deviceStatus)
        .limit(1);

      if (status.length === 0) {

        return {
          success: true,
          data: {
            meal1Completed: 0,
            meal2Completed: 0,
            meal3Completed: 0,
            meal4Completed: 0,
            meal5Completed: 0,
            meal6Completed: 0,

            currentTime: "--:--",

            isOnline: 0,

            lastUpdate: null,
          },
        };
      }

      return {
        success: true,
        data: status[0],
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | REGISTRAR ALIMENTAÇÃO
  |--------------------------------------------------------------------------
  */

  recordFeeding: publicProcedure
    .input(
      z.object({
        mealNumber: z.number().min(1).max(6),

        type: z.string(),
      })
    )
    .mutation(async ({ input }) => {

      await db.insert(feedingHistory).values({
        mealNumber: input.mealNumber,

        type: input.type,

        timestamp: new Date(),
      });

      return {
        success: true,
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | HISTÓRICO
  |--------------------------------------------------------------------------
  */

  getHistory: publicProcedure
    .query(async () => {

      const history = await db
        .select()
        .from(feedingHistory)
        .orderBy(desc(feedingHistory.timestamp))
        .limit(100);

      return {
        success: true,
        data: history,
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | ENVIAR COMANDO MANUAL
  |--------------------------------------------------------------------------
  */

  feedManual: publicProcedure
    .input(
      z.object({
        mealNumber: z.number().min(1).max(6),
      })
    )
    .mutation(async ({ input }) => {

      await db.insert(pendingCommands).values({
        type: `feed_meal_${input.mealNumber}`,

        createdAt: new Date(),
      });

      return {
        success: true,
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | OBTER COMANDO PENDENTE
  |--------------------------------------------------------------------------
  */

  getPendingCommand: publicProcedure
    .query(async () => {

      const commands = await db
        .select()
        .from(pendingCommands)
        .orderBy(desc(pendingCommands.createdAt))
        .limit(1);

      if (commands.length === 0) {

        return {
          success: true,
          data: null,
        };
      }

      const command = commands[0];

      await db
        .delete(pendingCommands)
        .where(eq(pendingCommands.id, command.id));

      return {
        success: true,
        data: command,
      };
    }),
});
