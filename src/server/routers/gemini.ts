import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  identifyDrawingType,
  extractLegend,
  analyzeTile,
  chatWithDrawing,
} from '../../services/geminiService';

export const geminiRouter = router({
  identifyDrawingType: protectedProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(async ({ input }) => {
      return identifyDrawingType(input.imageBase64);
    }),

  extractLegend: protectedProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(async ({ input }) => {
      return extractLegend(input.imageBase64);
    }),

  analyzeTile: protectedProcedure
    .input(z.object({
      tileBase64: z.string(),
      legend: z.array(z.object({
        itemName: z.string(),
        symbolDescription: z.string(),
        unit: z.string(),
      })),
      userPrompt: z.string(),
    }))
    .mutation(async ({ input }) => {
      return analyzeTile(input.tileBase64, input.legend, input.userPrompt);
    }),

  chat: protectedProcedure
    .input(z.object({
      imageBase64: z.string(),
      message: z.string(),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        text: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const response = await chatWithDrawing(input.imageBase64, input.message, input.history);
      return { text: response };
    }),
});
