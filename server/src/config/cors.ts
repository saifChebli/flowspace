import { CorsOptions } from 'cors';
import { env } from './env';

// Exact allowlist only. A wildcard (e.g. *.vercel.app) combined with
// credentials + the SameSite=None refresh cookie would let any page on that
// domain call /auth/refresh and read the returned access token. Add extra
// origins explicitly via CORS_EXTRA_ORIGINS (comma-separated) if needed.
const allowedOrigins = [
  env.CLIENT_URL,
  ...(env.CORS_EXTRA_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (curl, server-to-server, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Portal-Token'],
};
