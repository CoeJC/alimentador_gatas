<<<<<<< Updated upstream
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db";
=======
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
>>>>>>> Stashed changes
import {
  feederHistory,
  feederStatus,
  pendingCommands,
} from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// Importa o cache compartilhado do device API
import { deviceStatusCache } from "./device-api";

export const feederRouter = router({

  /*
   * ============================================================
   * STATUS
   * ============================================================
   */
<<<<<<< Updated upstream
=======
  feedManually: protectedProcedure
    .input(z.object({ mealNumber: z.number().int().min(1).max(6) }))
    .mutation(async ({ input }) => {
      try {
        const commandMap: Record<1 | 2 | 3 | 4 | 5 | 6, 'feed_meal_1' | 'feed_meal_2' | 'feed_meal_3' | 'feed_meal_4' | 'feed_meal_5' | 'feed_meal_6'> = {
          1: "feed_meal_1",
          2: "feed_meal_2",
          3: "feed_meal_3",
          4: "feed_meal_4",
          5: "feed_meal_5",
          6: "feed_meal_6",
        };
        await createPendingCommand(commandMap[input.mealNumber as 1 | 2 | 3 | 4 | 5 | 6]);
        await addFeedingSession("manual", input.mealNumber);
        return { success: true, message: "Alimentação manual acionada" };
      } catch (error) {
        console.error("Erro ao acionar alimentação manual:", error);
        throw error;
      }
    }),
>>>>>>> Stashed changes

  status: publicProcedure.query(async () => {

    const status = await db
      .select()
      .from(feederStatus)
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
   * ============================================================
   * HISTÓRICO
   * ============================================================
   */
<<<<<<< Updated upstream

  history: publicProcedure.query(async () => {

    const history = await db
      .select()
      .from(feederHistory)
      .orderBy(desc(feederHistory.timestamp))
      .limit(100);
=======
  getStatus: publicProcedure.query(async () => {
    const schedules = await getFeedingSchedules();
>>>>>>> Stashed changes

    // Usa o cache compartilhado do device API (atualizado pelo ESP8266)
    const status = {
      id: 1,
      meal1Completed: deviceStatusCache.meal1Completed || 0,
      meal2Completed: deviceStatusCache.meal2Completed || 0,
      meal3Completed: deviceStatusCache.meal3Completed || 0,
      meal4Completed: deviceStatusCache.meal4Completed || 0,
      meal5Completed: deviceStatusCache.meal5Completed || 0,
      meal6Completed: deviceStatusCache.meal6Completed || 0,
      currentTime: deviceStatusCache.currentTime || "--:--",
      nextMealTime: deviceStatusCache.nextMealTime || "--:--",
      isOnline: deviceStatusCache.isOnline || 0,
      lastSync: new Date(),
    };
    
    console.log("[FEEDER] getStatus - Cache:", deviceStatusCache);
    console.log("[FEEDER] getStatus - Retornando:", status);

    return {
      success: true,
      data: history,
    };
  }),

  /*
   * ============================================================
   * ALIMENTAÇÃO MANUAL
   * ============================================================
   */

  feedManual: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
      })
    )
    .mutation(async ({ input }) => {

      await db.insert(pendingCommands).values({
        command: `feed_meal_${input.mealNumber}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: `Comando da refeição ${input.mealNumber} enviado`,
      };
    }),

  /*
   * ============================================================
   * UPDATE STATUS
   * ============================================================
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
<<<<<<< Updated upstream

      const existing = await db
        .select()
        .from(feederStatus)
        .limit(1);

      if (existing.length === 0) {

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

      } else {

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
=======
      try {
        // Atualiza o banco de dados
        await updateDeviceStatus(input);
        
        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        throw error;
>>>>>>> Stashed changes
      }

<<<<<<< Updated upstream
      return {
        success: true,
      };
    }),

  /*
   * ============================================================
   * REGISTRAR ALIMENTAÇÃO
   * ============================================================
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
   * ============================================================
   * COMANDO PENDENTE
   * ============================================================
   */

  pendingCommand: publicProcedure.query(async () => {

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
      data: {
        type: command.command,
        timestamp: command.createdAt,
      },
    };
  }),
=======
  /**
   * Obtém o histórico de alimentações
   */
  getHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        return await getFeedingHistory(input.limit || 50);
      } catch (error) {
        console.error("Erro ao obter histórico:", error);
        throw error;
      }
    }),

  /**
   * Obtém os horários programados
   */
  getSchedules: publicProcedure.query(async () => {
    try {
      return await getFeedingSchedules();
    } catch (error) {
      console.error("Erro ao obter horários:", error);
      throw error;
    }
  }),

  /**
   * Atualiza um horário programado
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        mealNumber: z.number().int().min(1).max(6),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateFeedingSchedule(input.mealNumber, input.hour, input.minute);
        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar horário:", error);
        throw error;
      }
    }),

  /**
   * Obtém comandos pendentes
   */
  getPendingCommands: publicProcedure.query(async () => {
    try {
      return await getPendingCommands();
    } catch (error) {
      console.error("Erro ao obter comandos:", error);
      throw error;
    }
  }),

  /**
   * Marca um comando como reconhecido
   */
  acknowledgeCommand: publicProcedure
    .input(z.object({ commandId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await acknowledgeCommand(input.commandId);
        return { success: true };
      } catch (error) {
        console.error("Erro ao reconhecer comando:", error);
        throw error;
      }
    }),

  /**
   * Marca um comando como completo
   */
  completeCommand: publicProcedure
    .input(z.object({ commandId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await completeCommand(input.commandId);
        return { success: true };
      } catch (error) {
        console.error("Erro ao completar comando:", error);
        throw error;
      }
    }),
>>>>>>> Stashed changes
});
