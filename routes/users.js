const router = require('express').Router();
const auth   = require('../middlewares/auth');
const User   = require('../models/User');

// GET /api/users — admin only in production; scoped here for simplicity
router.get('/', auth, async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
