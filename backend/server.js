const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Set this in config.env to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100
});
app.use(limiter);

// Sanitize data
app.use(mongoSanitize());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
    res.send('Physicsium API is running...');
});

// Error handler middleware
const errorHandler = require('./middleware/error');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
