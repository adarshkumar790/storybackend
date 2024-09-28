const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');

dotenv.config();
connectDB();

const app = express();

// CORS configuration options
const corsOptions = {
    origin: '*', // Add allowed origins here
};

// Middleware
app.use(cors(corsOptions)); // Use CORS with the defined options
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
