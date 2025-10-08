require('dotenv').config()
const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const compression = require('compression')
const Moralis = require('moralis').default





const app = express()
// ✅ CORS Configuration

const corsOptions = {
  origin: '*', // Replace with your frontend domain
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'UPDATE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'header'],
  credentials: true, // Allow cookies and auth headers
  preflightContinue: false,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(compression())

// ✅ MongoDB Connection
mongoose.connect(process.env.DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.error('MongoDB connection error:', error)
})

// ✅ Multer Config
let dir = './public'
const multerStorage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname)
  }
})
app.use(multer({ storage: multerStorage }).single('photo'))
app.use('/public', express.static(path.join(__dirname, 'public')))

// ✅ Routes
const AdminRoutes = require("./routes/admin").router
const UserRoutes = require("./routes/user").router

app.use(AdminRoutes)
app.use(UserRoutes)

// ✅ Error Handling
app.use((err, req, res, next) => {

  if (err.statusCode) {
    err.message = err.message || 'An error occurred on the server'
    return res.status(err.statusCode).json({ response: err.message })
  }
  err.statusCode = 300
  err.message = err.message || 'An error occurred on the server'
  return res.status(err.statusCode).json({ response: err.message })
})



// ✅ Moralis Init and Server Start
Moralis.start({
  apiKey: process.env.MORALIS_API_KEY
}).then(() => {
  app.listen(process.env.PORT || 9090, () => {
    console.log("Server is listening on port 9090")
  })
})
