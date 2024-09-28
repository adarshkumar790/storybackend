const express = require('express');
const router = express.Router();
const {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    likeStory,
    bookmarkStory,
    downloadStory,
    getBookmarkedStories,
    getProfile
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(getStories)
    .post(protect, createStory);

router.route('stories/:id')
    .get(getStoryById)
    .put(protect, updateStory)
    .get(downloadStory);

router.post('/:id/like',  likeStory);
// router.post('/:id/bookmark',  bookmarkStory);
router.post('/:id/bookmark', protect, bookmarkStory);

router.get('/:id/download', downloadStory);


router.get('/profile', protect, getProfile);


router.get('/bookmarks', protect, getBookmarkedStories);



module.exports = router;
