import express from 'express';
import cors from 'cors';
import { apiRouter } from '../src/server/routes';

const app = express();

app.use(cors());
app.use(express.json());

// Support both /api prefixed routes and rewritten root routes
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
