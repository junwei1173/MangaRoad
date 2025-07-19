const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bookmarks: [String],
  ratings: [
  {
    mangaId: { type: String, required: true },
    score: { type: Number, required: true },
    review: { type: String, default: "" }
    
  },
],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model('User', UserSchema);
