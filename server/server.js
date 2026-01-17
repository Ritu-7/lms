import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/mongodb.js';
import { clerkWebhook } from './controllers/webhooks.js';

const app = express();

// Connect to Database
await connectDB();

// Middlewares
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Clerk Webhook route
// Note: We use express.json() here to handle the incoming webhook payload
app.post('/clerk', express.json(), clerkWebhook);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});