const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },  // To link image to the user
  imageUrl: { type: String, required: true },   // URL or path of the uploaded image
  isLocked: { type: Boolean, default: true },   // Locked or unlocked
  isFavorite: { type: Boolean, default: false },// Favorite marker (only for unlocked images)
  unlockDate: { type: Date, required: true },   // The date when image can be unlocked
  createdAt: { type: Date, default: Date.now }  // When image was uploaded
});

module.exports = mongoose.model('Image', imageSchema);
