require('dotenv').config();
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Connection error:', err));

const User = require('./models/User');
const Image = require('./models/Image');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
app.use(express.json());
const PORT = 3000;

// ---------- Multer storage ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'Uploads/'); // save files in 'Uploads' folder
  },
  filename: function (req, file, cb) {
    // save files with a unique name: current timestamp + original extension
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ---------- Session middleware (no passport) ----------
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

// Attach session user to req.user if exists
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

// helper to check login status
function isLoggedIn(req) {
  return !!(req.session && req.session.user);
}

// ---------- Fake dev login (local only) ----------
app.get('/dev-login', (req, res) => {
  // This is your "logged in" user for local dev
  const devUser = {
    id: '123',
    displayName: 'Manish Kumar',
    emails: [{ value: 'dev@example.com' }]
  };

  req.session.user = devUser;
  req.user = devUser;

  res.send("✔ Fake login successful! You are now logged in as Dev User. Go to /dashboard to test the app.");
});

// ---------- Logout ----------
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/');
  });
});

// ---------- Static files ----------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard - protected route
app.get('/dashboard', (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// collecting username
app.get('/api/user', (req, res) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ name: req.user.displayName });
});

// Auth middleware using session
function ensureAuth(req, res, next) {
  if (isLoggedIn(req)) {
    return next();
  }
  res.redirect('/login.html');  // or send 401 if you prefer
}

// ---------- Upload route ----------
app.post('/upload', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Logged in user:', req.user);
    console.log(req.file);
    console.log(req.body.unlockDate);

    const userEmail = req.user.emails[0].value;  // Use emails[0].value

    const newImage = new Image({
      userEmail,
      imageUrl: req.file.filename,
      isLocked: true,
      isFavorite: false,
      unlockDate: new Date(req.body.unlockDate),
    });

    await newImage.save();

    res.redirect('/dashboard');  // redirect to dashboard (home page)
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading image');
  }
});

// ---------- Get currently unlocked images ----------
app.get('/unlocked-images', ensureAuth, async (req, res) => {
  try {
    const userEmail = req.user.emails[0].value;

    const unlockedImages = await Image.find({
      userEmail,
      isLocked: false,
    }).sort({ createdAt: -1 });

    const imageUrls = unlockedImages.map(img => `/Uploads/${img.imageUrl}`);

    res.json(imageUrls);
  } catch (error) {
    console.error('Error fetching unlocked images:', error);
    res.status(500).json({ error: 'Failed to fetch unlocked images' });
  }
});

// ---------- Get images that should be unlocked (side panel) ----------
app.get('/api/side-unlocked-images', async (req, res) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = req.user.emails[0].value;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // UTC midnight

  try {
    const unlockedImages = await Image.find({
      userEmail,
      isLocked: true,
      unlockDate: { $lte: today },
    });

    const imageUrls = unlockedImages.map(img => `/Uploads/${img.imageUrl}`);

    res.json({ imageUrls });
  } catch (err) {
    console.error('Error fetching unlocked images:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Unlock button ----------
app.post('/api/unlock', ensureAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body; // Only the filename (e.g. "1748589898265.jpg")
    const userEmail = req.user.emails[0].value;

    const updated = await Image.findOneAndUpdate(
      { userEmail, imageUrl, isLocked: true },
      { $set: { isLocked: false } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Image not found or already unlocked' });
    }

    res.json({ message: 'Image unlocked successfully' });
  } catch (err) {
    console.error('Error unlocking image:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Favorite button ----------
app.post('/favorite-image', ensureAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userEmail = req.user.emails[0].value;

    console.log('Trying to favorite image:', imageUrl, 'for user:', userEmail);

    const result = await Image.findOneAndUpdate(
      { userEmail, imageUrl },
      { isFavorite: true }
    );

    if (!result) {
      console.log('Image not found in DB');
      return res.status(404).json({ error: 'Image not found' });
    }

    res.status(200).json({ message: 'Image marked as favorite' });
  } catch (err) {
    console.error('DB update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Delete button ----------
app.post('/delete-image', ensureAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body; // This is just the filename like 'abc.jpg'
    const userEmail = req.user.emails[0].value;

    // Step 1: Delete from the database
    const deleted = await Image.findOneAndDelete({ imageUrl, userEmail });

    if (!deleted) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Step 2: Delete the file from /Uploads/
    const filePath = path.join(__dirname, 'Uploads', imageUrl);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('File deletion error:', err);
        // Optional: You can still send success if DB delete succeeded
        return res.status(500).json({ error: 'Deleted from DB, but failed to delete file' });
      }

      console.log('File deleted from filesystem:', filePath);
      res.json({ message: 'Image deleted successfully' });
    });

  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Get favourite images ----------
app.get('/api/favouriteRoute', async (req, res) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = req.user.emails[0].value;

  try {
    const favouriteImages = await Image.find({
      userEmail,
      isLocked: false,
      isFavorite: true,
    });

    const imageUrls = favouriteImages.map(img => `/Uploads/${img.imageUrl}`);

    res.json({ imageUrls });
  } catch (err) {
    console.error('Error fetching favourite images:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Unfavorite button ----------
app.post('/api/unfavourite', ensureAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body; // Only the filename (e.g. "1748589898265.jpg")
    const userEmail = req.user.emails[0].value;

    const updated = await Image.findOneAndUpdate(
      { userEmail, imageUrl, isFavorite: true },
      { $set: { isFavorite: false } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Image not found or already unfavorite' });
    }

    res.json({ message: 'Image unfavorited successfully' });
  } catch (err) {
    console.error('Error unfavoriting image:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
