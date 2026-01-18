import mongoose from 'mongoose';


const purchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: String, 
        ref: 'User',
        required: true
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    // --- Razorpay Specific Fields ---
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: {
        type: String, 
    },
    razorpaySignature: {
        type: String, 
    }
}, { timestamps: true });


const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

export default Purchase;

// import mongoose from 'mongoose';

// const PurchseSchema = new mongoose.Schema({
//     courseId:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Course',
//         required: true
//     },
//         userId:{
//        type:String,
//        ref:'User',
//        required:true
//         },

//         amount :{type:Number,required:true},
//         status :{type:String,enum :['pending','completed','failed'],default:'pending'}},
//         {timestamps:true});

//       export  const Purchse = mongoose.model('Purchase',PurchseSchema)