import express from 'express';
import cors from 'cors';
import sessionRouter from './routes/session';
import attemptRouter from './routes/attempt';
import reviewRouter from './routes/review';
import metricsRouter from './routes/metrics';

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoints
app.get('/', (_req, res) => res.status(200).send('OK'));
app.get('/healthz', (_req, res) => res.status(200).send('healthy'));

app.use('/api/session', sessionRouter);
app.use('/api/attempt', attemptRouter);
app.use('/api/review', reviewRouter);
app.use('/api/metrics', metricsRouter);

const port = Number(process.env.PORT || 8081);
app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
