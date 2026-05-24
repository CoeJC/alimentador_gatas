import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getOrCreateDeviceStatus,
  updateDeviceStatus,
  addFeedingSession,
  getFeedingHistory,
  getFeedingSchedules,
  updateFeedingSchedule,
  createPendingCommand,
  getPendingCommands,
  acknowledgeCommand,
  completeCommand,
} from "../db";

// Importa o cache compartilhado do device API
import { deviceStatusCache } from "./device-api";

export const feederRouter = router({
  /**
   * Aciona a alimentação manual
   */
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

  /**
   * Obtém o status atual do dispositivo
   */
  getStatus: publicProcedure.query(async () => {
    const schedules = await getFeedingSchedules();

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
      device: status,
      schedules,
    };
  }),

  /**
   * Atualiza o status do dispositivo (chamado pelo ESP8266)
   */
  updateDeviceStatus: publicProcedure
    .input(
      z.object({
        meal1Completed: z.number().optional(),
        meal2Completed: z.number().optional(),
        meal3Completed: z.number().optional(),
        meal4Completed: z.number().optional(),
        meal5Completed: z.number().optional(),
        meal6Completed: z.number().optional(),
        currentTime: z.string().optional(),
        nextMealTime: z.string().optional(),
        isOnline: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Atualiza o banco de dados
        await updateDeviceStatus(input);
        
        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        throw error;
      }
    }),

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
});
