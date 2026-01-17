import { Webhook } from 'svix';
import User from '../models/User.js';

export const clerkWebhook = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        
        // Verify the webhook signature
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers['svix-id'],
            "svix-timestamp": req.headers['svix-timestamp'],
            "svix-signature": req.headers['svix-signature']
        });

        const { data, type } = req.body;

        switch (type) {
            case "user.created": {
                const userData = {
                    _id: data.id,
                    name: `${data.first_name} ${data.last_name}`,
                    email: data.email_addresses[0].email_address,
                    imageUrl: data.image_url
                };
                // Use create for a new user
                await User.create(userData);
                return res.status(201).json({ success: true });
            }

            case "user.updated": {
                const userData = {
                    name: `${data.first_name} ${data.last_name}`,
                    email: data.email_addresses[0].email_address,
                    imageUrl: data.image_url
                };
                await User.findByIdAndUpdate(data.id, userData);
                return res.status(200).json({ success: true });
            }

            case "user.deleted": {
                await User.findByIdAndDelete(data.id);
                return res.status(200).json({ success: true });
            }

            default:
                return res.status(400).json({ message: "Unhandled event type" });
        }
    } catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};