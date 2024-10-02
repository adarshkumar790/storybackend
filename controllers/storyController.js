const Story = require('../models/Story');
const User = require('../models/User');

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

const updateStory = async (req, res) => {
    const { title, slides, category } = req.body; 

    try {
        const story = await Story.findById(req.params.id); 

        if (story) {
            
            if (story.author.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to edit this story' });
            }

            
            if (title) {
                story.title = title;
            }
            if (slides) {
                if (slides.length < 3 || slides.length > 6) {
                    return res.status(400).json({ message: 'Slides must be between 3 and 6' });
                }
                story.slides = slides; 
            }
            if (category) {
                story.category = category; 
            }

            // Save the updated story
            const updatedStory = await story.save();
            return res.json(updatedStory); 
        } else {
            return res.status(404).json({ message: 'Story not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const likeStory = async (req, res) => {
    try {
        const userId = req.user._id;
        const story = await Story.findById(req.params.id);
        
        if (story) {
            const isLiked = story.likes.includes(userId);

            if (isLiked) {
                story.likes.pull(userId);  
                story.likeCount -= 1;
            } else {
                story.likes.push(userId);  
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

const bookmarkStory = async (req, res) => {
    try {
        const userId = req.user._id;
        const storyId = req.params.id;

        console.log(`User ID: ${userId}, Story ID: ${storyId}`); 

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isBookmarked = user.bookmarks.includes(storyId);
        if (isBookmarked) {
            user.bookmarks.pull(storyId);  
        } else {
            user.bookmarks.addToSet(storyId);  
        }

        await user.save();
        res.json({ bookmarks: user.bookmarks });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

const downloadStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        
        if (story) {
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

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -__v'); 

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



const getBookmarkedStories = async (req, res) => {
    try {
        
        const user = await User.findById(req.user._id).populate({
            path: 'bookmarks',
            populate: { path: 'author', select: 'username' } 
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            bookmarks: user.bookmarks, 
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
