const express = require('express');

const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// User Moddel
const User = require('../../models/User');

// @route  GET api/auth
// @desc   GET current user
// @access Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
