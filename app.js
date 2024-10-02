const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');

dotenv.config();
connectDB();

const app = express();


const corsOptions = {
    origin: '*', 
};


app.use(cors(corsOptions)); 
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
