import {Webhook} from 'svix';
import user from '../models/User.js';

// API conroller function to Manage Clerk User with database

export const clerkWebhook = async (req, res) => {
    try{
     const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(JSON.stringify(req.body), {
        "svix-id": req.headers['svix-id'],
        "svix-timestamp": req.headers['svix-timestamp'],
        "svix-signature": req.headers['svix-signature']
    })
    const {data, type} = req.body;

    switch(type){
        case "user.created":
            const userData = {
                _id: data.id,
                name: data.first_name + " " + data.last_name,
                email: data.email_addresses[0].email_address,
                imageUrl: data.image_url
            }
            await user.findByIdAndUpdate(userData._id, userData);
           { res.json({})
            break;}
        case "user.deleted":{
            await user.findByIdAndDelete(data.id);
            res.json({});
            break;}
        case "user.deleted":{
            await user.findByIdAndDelete(data.id);
            res.json({});
            break;
        }

        default:
            break;}
    }catch(error){
        res.json({error: "Invalid Webhook"});
    }}