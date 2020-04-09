const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// Models
const Post = require('../../models/Posts');
const User = require('../../models/User');

// @route  POST api/posts
// @desc   Create a post
// @access Private
router.post(
  '/',
  [authMiddleware, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById({ _id: req.user.id }).select('-password');

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id,
    });

    const post = await newPost.save();
    res.json(post);
  }
);

module.exports = router;
