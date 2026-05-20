import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// =====================================================
// MEMÓRIA TEMPORÁRIA
// =====================================================

let pendingCommand: string | null = null;

// =====================================================
// ROUTER
// =====================================================

export const feederRouter = router({

  // ===================================================
  // ENVIAR COMANDO MANUAL
  // ===================================================

  feedManual: publicProcedure
    .input(
      z.object({
        mealNumber: z.number(),
      })
    )
    .mutation(({ input }) => {

      const command = `feed_meal_${input.mealNumber}`;

      pendingCommand = command;

      console.log("[FEED MANUAL]", command);

      return {
        success: true,
        command,
      };
    }),

  // ===================================================
  // OBTER COMANDO PENDENTE
  // ===================================================

  getPendingCommand: publicProcedure.query(() => {

    if (!pendingCommand) {

      return {
        success: true,
        data: null,
      };
    }

    const command = pendingCommand;

    pendingCommand = null;

    console.log("[PENDING COMMAND]", command);

    return {
      success: true,
      data: {
        type: command,
        timestamp: new Date().toISOString(),
      },
    };
  }),
});
