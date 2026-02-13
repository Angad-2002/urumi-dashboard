import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use(errorHandler);

const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Store Weaver backend at http://localhost:${port} (listening on ${host})`);
});
