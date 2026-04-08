import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { db } from '../../db/index';
import { projects } from '../../db/schema';

export const projectsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(projects).values({ name: input.name }).$returningId();
      return { id: result.id, name: input.name };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),
});
