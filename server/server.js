import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';

import webhookRoutes from './routes/webhookRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';

import { clerkMiddleware } from '@clerk/express';

const app = express();

await connectDB();
await connectCloudinary();

app.use(cors());

app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/courses', courseRouter);

app.use(clerkMiddleware());
app.use('/api/user', userRouter);
app.use('/api/educator', educatorRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
