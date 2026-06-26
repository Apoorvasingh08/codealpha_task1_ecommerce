const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Post, User } = require('../models');

// Initial seed posts to make feed look engaging and premium
const SEED_POSTS = [
  {
    userId: 'seed_user_1',
    username: 'design_craft',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=design_craft',
    caption: 'Loving the clean shadows and subtle gradients on this new dashboard layout. Feedback is welcome! 🎨✨ #webdesign #uiux #glassmorphism',
    image: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&auto=format&fit=crop&q=60',
    likes: ['seed_user_2', 'seed_user_3'],
    comments: [
      {
        userId: 'seed_user_2',
        username: 'tech_traveler',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=tech_traveler',
        text: 'This is gorgeous! The color harmony is spot on.',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        userId: 'seed_user_3',
        username: 'code_hustler',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=code_hustler',
        text: 'Are you using Tailwind or custom CSS? Clean stuff.',
        createdAt: new Date(Date.now() - 1800000)
      }
    ]
  },
  {
    userId: 'seed_user_2',
    username: 'tech_traveler',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=tech_traveler',
    caption: 'Chasing sunsets and compiling code in the mountains. Remote work at its peak! ⛰️💻 #remotework #developerlife #mountainvibes',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60',
    likes: ['seed_user_1'],
    comments: [
      {
        userId: 'seed_user_1',
        username: 'design_craft',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=design_craft',
        text: 'Wow, talk about an office view. Insane!',
        createdAt: new Date(Date.now() - 7200000)
      }
    ]
  }
];

// Helper to seed posts if empty
async function ensurePostsSeeded() {
  const count = await Post.find({});
  if (count.length === 0) {
    console.log('🌱 Seeding posts to database...');
    for (const post of SEED_POSTS) {
      await Post.create(post);
    }
  }
}

// @route   GET api/social/posts
// @desc    Get all posts (feeds)
router.get('/posts', async (req, res) => {
  try {
    await ensurePostsSeeded();
    const posts = await Post.find({});
    // Sort posts by newest
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
});

// @route   POST api/social/posts
// @desc    Create a new post
router.post('/posts', auth, async (req, res) => {
  const { caption, image } = req.body;

  if (!caption) {
    return res.status(400).json({ message: 'Caption is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newPost = await Post.create({
      userId: user._id,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`,
      caption,
      image: image || '',
      likes: [],
      comments: []
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// @route   POST api/social/posts/:id/like
// @desc    Like or Unlike a post
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id;
    let updatedLikes = [...(post.likes || [])];

    if (updatedLikes.includes(userId)) {
      // Unlike: remove userId from likes array
      updatedLikes = updatedLikes.filter(id => id !== userId);
    } else {
      // Like: add userId to likes array
      updatedLikes.push(userId);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: updatedLikes } },
      { new: true }
    );

    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggle like' });
  }
});

// @route   POST api/social/posts/:id/comment
// @desc    Add comment to a post
router.post('/posts/:id/comment', auth, async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newComment = {
      _id: Math.random().toString(36).substring(2, 11),
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      text,
      createdAt: new Date().toISOString()
    };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: newComment } },
      { new: true }
    );

    res.status(201).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   POST api/social/users/:id/follow
// @desc    Follow or Unfollow a user
router.post('/users/:id/follow', auth, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let following = [...(currentUser.following || [])];
    let followers = [...(targetUser.followers || [])];

    let isFollowing = following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      following = following.filter(id => id !== targetUserId);
      followers = followers.filter(id => id !== currentUserId);
    } else {
      // Follow
      following.push(targetUserId);
      followers.push(currentUserId);
    }

    await User.findByIdAndUpdate(currentUserId, { $set: { following } });
    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { followers } },
      { new: true }
    );

    res.json({
      following,
      targetUser: {
        id: updatedTargetUser._id,
        username: updatedTargetUser.username,
        avatar: updatedTargetUser.avatar,
        followers: updatedTargetUser.followers,
        following: updatedTargetUser.following
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling follow' });
  }
});

module.exports = router;
