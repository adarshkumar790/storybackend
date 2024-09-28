const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    video: {
        type: String,
    },
    text: {
        type: String,
        required: true,
    },
});

const StorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slides: {
        type: [SlideSchema],
        validate: [slidesLimit, '{PATH} exceeds the limit of 6 slides'],
    },
    category: {
        type: String,
        enum: ['food', 'health and fitness', 'travel', 'movie', 'education'],
        required: true,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    likeCount: {
        type: Number,
        default: 0,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

function slidesLimit(val) {
    return val.length >= 3 && val.length <= 6;
}

module.exports = mongoose.model('Story', StorySchema);
