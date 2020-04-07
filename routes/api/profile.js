const express = require('express');
const { check, validationResult } = require('express-validator');
const normalizeURL = require('normalize-url');
const mongoose = require('mongoose');

const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// Models
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route  GET api/profile/me
// @desc   Get current user profile
// @access Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route  POST api/profile/
// @desc   Create or update user profile
// @access Private
router.post(
  '/',
  [
    authMiddleware,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website)
      profileFields.website = normalizeURL(website, { forceHttps: true });
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube)
      profileFields.social.youtube = normalizeURL(youtube, {
        forceHttps: true,
      });
    if (twitter)
      profileFields.social.twitter = normalizeURL(twitter, {
        forceHttps: true,
      });
    if (instagram)
      profileFields.social.instagram = normalizeURL(instagram, {
        forceHttps: true,
      });
    if (linkedin)
      profileFields.social.linkedin = normalizeURL(linkedin, {
        forceHttps: true,
      });
    if (facebook)
      profileFields.social.facebook = normalizeURL(facebook, {
        forceHttps: true,
      });

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // update Profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // Create Profile
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  GET api/profile/
// @desc   GET all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/user/:user_id
// @desc   GET profiles by ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == undefined) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile/
// @desc   Delete profile, user & posts
// @access Private
router.delete('/', authMiddleware, async (req, res) => {
  try {
    // Delete Profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Delete User
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/experience
// @desc   Adding Experience to profile
// @access Private
router.put(
  '/experience',
  [
    authMiddleware,
    check('title', 'Title is Required').not().isEmpty(),
    check('company', 'Company is Required').not().isEmpty(),
    check('from', 'From date is Required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      from,
      to,
      current,
      description,
      location,
    } = req.body;

    const newExp = {
      title,
      company,
      from,
      to,
      current,
      description,
      location,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
