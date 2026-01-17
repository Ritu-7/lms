import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose, { connect } from 'mongoose'
import dotenv from 'dotenv'
import connectDB from './configs/mongodb.js'
import { clerkWebhook } from './controllers/webhooks.js'

// initilize express
const app = express()
// connect to database
await connectDB();

// middleware
app.use(cors())
app.use(bodyParser.json())

// routes
app.get('/', (req, res) => {
  res.send('API is running...')
})

app.post('/clerk', express.json(), clerkWebhook);

// Port
const PORT = process.env.PORT || 5000
// load environment variables
dotenv.config()

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
}   
)   