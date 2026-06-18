import { CorsOptions } from 'cors';
import { env } from './env';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [env.CLIENT_URL];
    // Allow requests with no origin (mobile apps, curl, Postman),
    // the configured client URL, and Vercel preview deployments.
    const isVercelPreview = !!origin && /\.vercel\.app$/.test(new URL(origin).hostname);
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Portal-Token'],
};
