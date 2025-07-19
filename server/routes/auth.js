const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    
    if (!username || !username.trim()) {
      return res.status(400).json({ msg: "Username is required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ msg: "Username already exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({ username: username.trim(), password: hash });
    await newUser.save();

    res.json({ msg: "Registration successful. Please log in." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "No user found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user', async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json({
      id: user._id,
      username: user.username,
      bookmarks: user.bookmarks,
      ratings: user.ratings,
      following: user.following || [],
      followers: user.followers || []
    });

  } catch (err) {
    res.status(400).json({ msg: "Token not valid" });
  }
});

router.get('/users', async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ msg: "No user IDs provided" });
    }

    const userIds = ids.split(',');
    const users = await User.find({ 
      _id: { $in: userIds },
      username: { $exists: true, $ne: "", $ne: null }
    }).select('username _id');
    
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/follow/:id", async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token" });

  const { id } = req.params;
  console.log("Follow request for user ID:", id);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token user ID:", decoded.id);

    const me = await User.findById(decoded.id);
    const other = await User.findById(id);

    if (!me) {
      console.log("Current user not found");
      return res.status(404).json({ msg: "User not found" });
    }
    if (!other) {
      console.log("Target user not found");
      return res.status(404).json({ msg: "User not found" });
    }
    if (me._id.equals(other._id)) {
      console.log("User tried to follow themselves");
      return res.status(400).json({ msg: "Can't follow yourself" });
    }

    // Check if a valid username
    if (!other.username || !other.username.trim()) {
      return res.status(400).json({ msg: "Cannot follow user with invalid profile" });
    }


    if (!Array.isArray(me.following)) me.following = [];
    if (!Array.isArray(other.followers)) other.followers = [];

    if (!me.following.some(f => f.equals(other._id))) {
      me.following.push(other._id);
      other.followers.push(me._id);

      await me.save();
      await other.save();

      console.log(`User ${me.username} now follows ${other.username}`);
    } else {
      console.log("User already follows this user");
    }

    res.json({ msg: `Now following ${other.username}` });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Unfollow a user
router.post("/unfollow/:id", async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token" });

  const { id } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const me = await User.findById(decoded.id);
    const other = await User.findById(id);

    if (!me || !other) return res.status(404).json({ msg: "User not found" });

    me.following = me.following.filter(f => !f.equals(other._id));
    other.followers = other.followers.filter(f => !f.equals(me._id));
    await me.save();
    await other.save();

    res.json({ msg: `Unfollowed ${other.username || 'user'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/public", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username bookmarks ratings followers following");

    if (!user) return res.status(404).json({ msg: "User not found" });

    

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get('/all-users', async (req, res) => {
  try {
    // Only fetch users with valid usernames
    const users = await User.find({
      username: { $exists: true, $ne: "", $ne: null }
    }).select('username _id bookmarks ratings followers following');
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;