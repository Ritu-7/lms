import express from 'express';
import bodyParser from 'body-parser';
import {
  clerkWebhook,
  razorpayWebhook,
} from '../controllers/webhooks.js';

const router = express.Router();

router.post(
  '/clerk',
  bodyParser.raw({ type: 'application/json' }),
  clerkWebhook
);

router.post(
  '/razorpay',
  bodyParser.raw({ type: 'application/json' }),
  razorpayWebhook
);

export default router;

