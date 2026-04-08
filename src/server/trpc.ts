import { initTRPC, TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';

export interface Context {
  req: Request;
  res: Response;
  userId?: string;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Faça login para continuar.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
