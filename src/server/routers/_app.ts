import { router } from '../trpc';
import { projectsRouter } from './projects';
import { takeoffsRouter } from './takeoffs';
import { geminiRouter } from './gemini';

export const appRouter = router({
  projects: projectsRouter,
  takeoffs: takeoffsRouter,
  gemini: geminiRouter,
});

export type AppRouter = typeof appRouter;
