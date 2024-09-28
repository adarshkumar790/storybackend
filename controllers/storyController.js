const Story = require('../models/Story');
const User = require('../models/User');
// @desc    Get all stories with filters
// @route   GET /api/stories
// @access  Public
const getStories = async (req, res) => {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};
    
    try {
        const stories = await Story.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const count = await Story.countDocuments(query);
        
        res.json({
            stories,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Public
const getStoryById = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id).populate('author', 'username');
        if (story) {
            res.json(story);
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
    const { title, slides, category } = req.body;
    
    if (!title || !slides || slides.length < 3 || slides.length > 6 || !category) {
        return res.status(400).json({ message: 'Invalid story data' });
    }
    
    try {
        const story = new Story({
            title,
            slides,
            category,
            author: req.user._id,
        });
        
        const createdStory = await story.save();
        res.status(201).json(createdStory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
// @access  Private
// @desc    Update a story
// @route   PUT /api/stories/:id
// @access  Private
const updateStory = async (req, res) => {
    const { title, slides, category } = req.body; // Accept 'slides' and 'category'

    try {
        const story = await Story.findById(req.params.id); // Find the story by ID

        if (story) {
            // Check if the user is the author
            if (story.author.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to edit this story' });
            }

            // Validate the new data
            if (title) {
                story.title = title;
            }
            if (slides) {
                if (slides.length < 3 || slides.length > 6) {
                    return res.status(400).json({ message: 'Slides must be between 3 and 6' });
                }
                story.slides = slides; // Update slides only if provided and valid
            }
            if (category) {
                story.category = category; // Update category only if provided
            }

            // Save the updated story
            const updatedStory = await story.save();
            return res.json(updatedStory); // Return the updated story
        } else {
            return res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Like or Unlike a story
// @route   POST /api/stories/:id/like
// @access  Private
const likeStory = async (req, res) => {
    try {
        const userId = req.user._id;
        const story = await Story.findById(req.params.id);
        
        if (story) {
            const isLiked = story.likes.includes(userId);

            if (isLiked) {
                story.likes.pull(userId);  // Unlike the story
                story.likeCount -= 1;
            } else {
                story.likes.push(userId);  // Like the story
                story.likeCount += 1;
            }

            await story.save();
            res.json({ 
                likes: story.likeCount,
                liked: !isLiked 
            });
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Bookmark a story
// @route   POST /api/stories/:id/bookmark
// @access  Private
// @desc    Bookmark a story
// @route   POST /api/stories/:id/bookmark
// @access  Private
const bookmarkStory = async (req, res) => {
    try {
        const userId = req.user._id;
        const storyId = req.params.id;

        console.log(`User ID: ${userId}, Story ID: ${storyId}`); // Log user and story ID

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isBookmarked = user.bookmarks.includes(storyId);
        if (isBookmarked) {
            user.bookmarks.pull(storyId);  // Remove bookmark
        } else {
            user.bookmarks.addToSet(storyId);  // Add bookmark
        }

        await user.save();
        res.json({ bookmarks: user.bookmarks });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Download a story
// @route   GET /api/stories/:id/download
// @access  Public
const downloadStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        
        if (story) {
            // For simplicity, we'll send the story data as JSON.
            // You can format it as needed (e.g., PDF, EPUB).
            res.setHeader('Content-disposition', `attachment; filename=${story.title}.json`);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(story, null, 2));
        } else {
            res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        // Fetch the user and exclude the password from the response
        const user = await User.findById(req.user.id).select('-password -__v'); // Exclude password and version key

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Get bookmarked stories
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarkedStories = async (req, res) => {
    try {
        // Fetch the user along with their bookmarked stories
        const user = await User.findById(req.user._id).populate({
            path: 'bookmarks',
            populate: { path: 'author', select: 'username' } // Populate the author's username
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the bookmarks in the response
        res.json({
            bookmarks: user.bookmarks, // This will include the populated stories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    likeStory,
    bookmarkStory,
    downloadStory,
    getBookmarkedStories,
    getProfile
};
