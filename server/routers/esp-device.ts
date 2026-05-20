import { z } from "zod";
import { router, publicProcedure } from "../trpc";

let pendingCommand: string | null = null;

let deviceStatus = {
  meal1Completed: 0,
  meal2Completed: 0,
  meal3Completed: 0,
  meal4Completed: 0,
  meal5Completed: 0,
  meal6Completed: 0,
  currentTime: "--:--",
  isOnline: 0,
  lastUpdate: new Date(),
};

let feedingHistory: any[] = [];

export const espDeviceRouter = router({

  /*
   * ============================================================
   * STATUS
   * ============================================================
   */

  getStatus: publicProcedure.query(() => {

    return {
      success: true,
      data: deviceStatus,
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
    .mutation(({ input }) => {

      deviceStatus = {
        ...input,
        lastUpdate: new Date(),
      };

      console.log("[STATUS] Atualizado:", deviceStatus);

      return {
        success: true,
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
        mealNumber: z.number().min(1).max(6),
      })
    )
    .mutation(({ input }) => {

      pendingCommand = `feed_meal_${input.mealNumber}`;

      console.log(
        `[MANUAL] Comando enviado: ${pendingCommand}`
      );

      return {
        success: true,
        command: pendingCommand,
      };
    }),

  /*
   * ============================================================
   * PENDING COMMAND
   * ============================================================
   */

  getPendingCommand: publicProcedure.query(() => {

    if (!pendingCommand) {

      return {
        success: true,
        data: null,
      };
    }

    const command = {
      type: pendingCommand,
      timestamp: new Date(),
    };

    console.log("[POLLING] Comando entregue:", command);

    pendingCommand = null;

    return {
      success: true,
      data: command,
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
        mealNumber: z.number().min(1).max(6),
        type: z.string(),
      })
    )
    .mutation(({ input }) => {

      const registro = {
        id: Date.now(),
        mealNumber: input.mealNumber,
        type: input.type,
        timestamp: new Date(),
      };

      feedingHistory.push(registro);

      console.log("[HISTORICO] Novo registro:", registro);

      return {
        success: true,
        data: registro,
      };
    }),

  /*
   * ============================================================
   * HISTÓRICO
   * ============================================================
   */

  getHistory: publicProcedure.query(() => {

    return {
      success: true,
      data: feedingHistory,
    };
  }),

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  resetMeals: publicProcedure.mutation(() => {

    deviceStatus.meal1Completed = 0;
    deviceStatus.meal2Completed = 0;
    deviceStatus.meal3Completed = 0;
    deviceStatus.meal4Completed = 0;
    deviceStatus.meal5Completed = 0;
    deviceStatus.meal6Completed = 0;

    console.log("[RESET] Refeições resetadas");

    return {
      success: true,
    };
  }),
});
