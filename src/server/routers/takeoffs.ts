import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { db } from '../../db/index';
import { takeoffs } from '../../db/schema';

export const takeoffsRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(takeoffs).where(eq(takeoffs.projectId, input.projectId));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      itemName: z.string().min(1),
      category: z.string().optional(),
      quantity: z.number(),
      unit: z.string(),
      details: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(takeoffs).values({
        projectId: input.projectId,
        itemName: input.itemName,
        category: input.category,
        quantity: String(input.quantity),
        unit: input.unit,
        details: input.details ? JSON.stringify(input.details) : null,
      }).$returningId();
      return { id: result.id };
    }),

  deleteByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(takeoffs).where(eq(takeoffs.projectId, input.projectId));
      return { success: true };
    }),
});
