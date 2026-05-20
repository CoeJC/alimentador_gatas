import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db";

import {
  feederHistory,
  feederStatus,
  pendingCommands,
} from "../../drizzle/schema";

const espDeviceRouter = router({

  /*
   * =========================================================
   * STATUS DO ESP
   * =========================================================
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
        .from(feederStatus)
        .limit(1);

      if (existing.length > 0) {

        await db
          .update(feederStatus)
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
          .where(eq(feederStatus.id, existing[0].id));

      } else {

        await db.insert(feederStatus).values({
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
      }

      return {
        success: true,
      };
    }),

  /*
   * =========================================================
   * REGISTRAR ALIMENTAÇÃO
   * =========================================================
   */

  recordFeeding: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
        type: z.string(),
      })
    )
    .mutation(async ({ input }) => {

      await db.insert(feederHistory).values({
        mealNumber: input.mealNumber,
        type: input.type,
        timestamp: new Date(),
      });

      return {
        success: true,
      };
    }),

  /*
   * =========================================================
   * PEGAR COMANDO PENDENTE
   * =========================================================
   */

  getPendingCommand: publicProcedure
    .query(async () => {

      const command = await db
        .select()
        .from(pendingCommands)
        .where(eq(pendingCommands.executed, 0))
        .orderBy(desc(pendingCommands.createdAt))
        .limit(1);

      if (command.length === 0) {

        return {
          success: true,
          data: null,
        };
      }

      /*
       * marca comando como executado
       */

      await db
        .update(pendingCommands)
        .set({
          executed: 1,
        })
        .where(eq(pendingCommands.id, command[0].id));

      return {
        success: true,
        data: {
          type: command[0].command,
          timestamp: command[0].createdAt,
        },
      };
    }),

});

export default espDeviceRouter;
