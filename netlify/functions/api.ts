import serverless from 'serverless-http';
import { app } from '../../src/server/app';
import { db } from '../../src/server/db';

let dbInitPromise: Promise<void> | null = null;

const ensureDb = async () => {
  if (!dbInitPromise) {
    dbInitPromise = db.connect().catch((err) => {
      console.warn('[Netlify Functions] DB connect error:', err);
    });
  }
  return dbInitPromise;
};

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  await ensureDb();
  return serverlessHandler(event, context);
};
