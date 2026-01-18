import { Webhook } from 'svix';
import crypto from 'crypto';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';

export const clerkWebhook = async (req, res) => {
  try {


    const payload = req.body.toString('utf8');

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const event = wh.verify(payload, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    });

    const { type, data } = event;

    if (type === 'user.created') {
      await User.create({
        _id: data.id,
        name: `${data.first_name} ${data.last_name || ''}`,
        email: data.email_addresses?.[0]?.email_address || '',
        imageUrl: data.image_url,
      });
    }

    if (type === 'user.updated') {
      await User.findByIdAndUpdate(data.id, {
        name: `${data.first_name} ${data.last_name || ''}`,
        email: data.email_addresses?.[0]?.email_address || '',
        imageUrl: data.image_url,
      });
    }

    if (type === 'user.deleted') {
      await User.findByIdAndDelete(data.id);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ success: false });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const payload = req.body.toString('utf8');

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(payload);

    if (event.event === 'order.paid') {
      const orderId = event.payload.order.entity.id;

      const purchase = await Purchase.findOne({
        razorpayOrderId: orderId,
      });

      if (purchase && purchase.status !== 'completed') {
        purchase.status = 'completed';
        purchase.razorpayPaymentId =
          event.payload.payment.entity.id;

        await purchase.save();

        await User.findByIdAndUpdate(purchase.userId, {
          $addToSet: { enrolledCourses: purchase.courseId },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false });
  }
};


// import { Webhook } from 'svix';
// import User from '../models/User.js';

// export const clerkWebhook = async (req, res) => {
//     try {
//         const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        
//         // Verify the webhook signature
//         await whook.verify(JSON.stringify(req.body), {
//             "svix-id": req.headers['svix-id'],
//             "svix-timestamp": req.headers['svix-timestamp'],
//             "svix-signature": req.headers['svix-signature']
//         });

//         const { data, type } = req.body;

//         switch (type) {
//             case "user.created": {
//                 const userData = {
//                     _id: data.id,
//                     name: `${data.first_name} ${data.last_name}`,
//                     email: data.email_addresses[0].email_address,
//                     imageUrl: data.image_url
//                 };
//                 // Use create for a new user
//                 await User.create(userData);
//                 return res.status(201).json({ success: true });
//             }

//             case "user.updated": {
//                 const userData = {
//                     name: `${data.first_name} ${data.last_name}`,
//                     email: data.email_addresses[0].email_address,
//                     imageUrl: data.image_url
//                 };
//                 await User.findByIdAndUpdate(data.id, userData);
//                 return res.status(200).json({ success: true });
//             }

//             case "user.deleted": {
//                 await User.findByIdAndDelete(data.id);
//                 return res.status(200).json({ success: true });
//             }

//             default:
//                 return res.status(400).json({ message: "Unhandled event type" });
//         }
//     } catch (error) {
//         console.error("Webhook Error:", error.message);
//         res.status(400).json({ success: false, message: error.message });
//     }
// };

// const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
// export const stripeWebhook = async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;  
//     try {
//         event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
//     }
//     catch (err) {
//         console.log(`Webhook Error: ${err.message}`);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }   
//     // Handle the event
//     switch (event.type) {
//         case 'payment_intent.succeeded':        
//             const paymentIntent = event.data.object;
//             console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);       
//             // Then define and call a function to handle the event payment_intent.succeeded
//             break;  
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }       
//     // Return a 200 response to acknowledge receipt of the event
//     res.json({ received: true });
// };
