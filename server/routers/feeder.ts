import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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

export const feederRouter = router({
  /**
   * Aciona a alimentação manual
   */
  feedManually: protectedProcedure
    .input(z.object({ mealNumber: z.number().int().min(1).max(2) }))
    .mutation(async ({ input }) => {
      try {
        const commandMap: Record<1 | 2, 'feed_meal_1' | 'feed_meal_2'> = {
          1: "feed_meal_1",
          2: "feed_meal_2",
        };
        await createPendingCommand(commandMap[input.mealNumber as 1 | 2]);
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
    const status = await getOrCreateDeviceStatus();
    const schedules = await getFeedingSchedules();

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
        currentTime: z.string().optional(),
        nextMealTime: z.string().optional(),
        isOnline: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await updateDeviceStatus({
          meal1Completed: input.meal1Completed,
          meal2Completed: input.meal2Completed,
          currentTime: input.currentTime,
          nextMealTime: input.nextMealTime,
          isOnline: input.isOnline,
        });

        return { success: true, data: result };
      } catch (error) {
        console.error("Erro ao atualizar status do dispositivo:", error);
        throw error;
      }
    }),

  /**
   * Obtém o histórico de alimentações
   */
  getHistory: publicProcedure
    .input(z.object({ limit: z.number().int().default(20).optional() }))
    .query(async ({ input }) => {
      const history = await getFeedingHistory(input.limit || 20);
      return history;
    }),

  /**
   * Atualiza os horários de alimentação
   */
  setSchedule: protectedProcedure
    .input(
      z.object({
        mealNumber: z.number().int().min(1).max(2),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateFeedingSchedule(input.mealNumber, input.hour, input.minute);
        return { success: true, message: "Horário atualizado" };
      } catch (error) {
        console.error("Erro ao atualizar horário:", error);
        throw error;
      }
    }),

  /**
   * Obtém um comando pendente para o ESP8266 (polling)
   */
  getPendingCommand: publicProcedure
    .input(z.object({ deviceId: z.string().optional() }))
    .query(async () => {
      const commands = await getPendingCommands(1);
      return commands.length > 0 ? commands[0] : null;
    }),

  /**
   * Registra uma alimentação automática (chamada pelo ESP8266)
   */
  recordAutoFeeding: publicProcedure
    .input(z.object({ mealNumber: z.number().int().min(1).max(2) }))
    .mutation(async ({ input }) => {
      try {
        await addFeedingSession("automatic", input.mealNumber);
        return { success: true };
      } catch (error) {
        console.error("Erro ao registrar alimentação automática:", error);
        throw error;
      }
    }),

  /**
   * Confirma que um comando foi recebido pelo ESP8266
   */
  acknowledgeCommand: publicProcedure
    .input(z.object({ commandId: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await acknowledgeCommand(input.commandId);
        return { success: true };
      } catch (error) {
        console.error("Erro ao confirmar comando:", error);
        throw error;
      }
    }),

  /**
   * Marca um comando como completado
   */
  completeCommand: publicProcedure
    .input(z.object({ commandId: z.number().int() }))
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
