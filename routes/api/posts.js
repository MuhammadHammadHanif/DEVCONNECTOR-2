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
    try {
      const user = await User.findById({ _id: req.user.id }).select(
        '-password'
      );
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route  GET api/posts/
// @desc   Get allposts
// @access Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/posts/:post_id
// @desc   Get post by ID
// @access Private
router.get('/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }
    res.json(post);
  } catch (err) {
    if (err.kind === undefined) {
      return res.status(404).json({ msg: 'No post found' });
    }
    console.error(err.kind);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/posts/:post_id
// @desc   Delete post by ID
// @access Private
router.delete('/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await post.remove();
    res.json({ msg: 'Post Removed' });
  } catch (err) {
    if (err.kind === undefined) {
      return res.status(404).json({ msg: 'No post found' });
    }
    console.error(err.kind);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/posts/like/:post_id
// @desc   Like post by ID
// @access Private
router.put('/like/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    // Check if post have already been liked by user
    if (
      post.likes.filter((item) => item.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(404).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind === undefined) {
      return res.status(404).json({ msg: 'No post found' });
    }
    console.error(err.kind);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/posts/unlike/:post_id
// @desc   Like post by ID
// @access Private
router.put('/unlike/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    // Check if post have already been liked by user
    if (
      post.likes.filter((item) => item.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(404).json({ msg: 'Post has not yet been liked' });
    }

    // Remove like
    post.likes = post.likes.filter(
      (item) => item.user.toString() !== req.user.id
    );

    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind === undefined) {
      return res.status(404).json({ msg: 'No post found' });
    }
    console.error(err.kind);
    res.status(500).send('Server error');
  }
});

// @route  POST api/posts/comment/:post_id
// @desc   Comment on a post
// @access Private
router.post(
  '/comment/:post_id',
  [authMiddleware, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById({ _id: req.user.id }).select(
        '-password'
      );
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).json({ msg: 'No post found' });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route  DELETE api/posts/comment/:post_id/:comment_id
// @desc   Delete comment by ID
// @access Private
router.delete(
  '/comment/:post_id/:comment_id',
  authMiddleware,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.post_id);
      // check if post exists
      if (!post) {
        return res.status(404).json({ msg: 'No post found' });
      }

      const comment = post.comments.find(
        (item) => item.id == req.params.comment_id
      );
      // check if comment exists
      if (!comment) {
        return res.status(404).json({ msg: 'Comment does not exists' });
      }

      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      // Remove Comment
      post.comments = post.comments.filter(
        (item) => item._id.toString() !== req.params.comment_id
      );

      await post.save();
      res.json(post.comments);
    } catch (err) {
      if (err.kind === undefined) {
        return res.status(404).json({ msg: 'Comment does not exists' });
      }
      console.error(err.kind);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
