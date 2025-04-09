require('dotenv').config()
const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const compression = require('compression')
const axios = require('axios')
const fetch = require('node-fetch')
let request = require('request')

const app = express()
const corsOptions = {
  origin: '*', // You can restrict this to a specific domain like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'UPDATE','PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'header'], // Add custom headers here
  preflightContinue: false,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}

app.use(cors(corsOptions))


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(compression())

// Connect to MongoDB
mongoose.connect(process.env.DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.error('MongoDB connection error:', error)
})

// Configure multer for file uploads
let dir = './public'
const multerStorage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname)
  }
})

app.use(multer({ storage: multerStorage }).single('photo'))
app.use('/public', express.static(path.join(__dirname, 'public')))


// Importing routes
const AdminRoutes = require("./routes/admin").router
const UserRoutes = require("./routes/user").router

app.use(AdminRoutes)
app.use(UserRoutes)


// Error handling middleware
app.use((err, req, res, next) => {
  console.log(err)
  
  if(err.statusCode){
    err.message = err.message || 'An error occurred on the server'
    return res.status(err.statusCode).json({ response: err.message })

  }
  err.statusCode = 300 
  err.message = err.message || 'An error occurred on the server'
  return res.status(err.statusCode).json({ response: err.message })
  
})

// Start server on port 9090
app.listen(process.env.PORT || 9090, () => {
  console.log("Server is listening on port 9090")
})
