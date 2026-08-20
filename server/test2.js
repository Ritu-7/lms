import 'dotenv/config';
import connectDB from "./configs/mongodb.js";
import { getUserData } from "./controllers/userController.js";

async function run() {
  await connectDB();
  const req = { clerkUserId: "user_test_" + Date.now() };
  const res = {
    status: (code) => {
      console.log("Status:", code);
      return res;
    },
    json: (data) => {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  };
  await getUserData(req, res);
  process.exit();
}
run();
