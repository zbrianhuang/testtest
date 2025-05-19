const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Video Schema
const videoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  artist: { type: String, required: true },
  coverArtist: { type: String, required: true },
  uploadDate: { type: Number, required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  s3Key: { type: String, required: true },
  thumbnailKey: { type: String, required: true }
});

const Video = mongoose.model('Video', videoSchema);

// Routes
// Get trending videos
app.get('/api/videos/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const videos = await Video.find()
      .sort({ views: -1 })
      .limit(limit);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent videos
app.get('/api/videos/recent', async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get popular videos
app.get('/api/videos/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const videos = await Video.find()
      .sort({ likes: -1 })
      .limit(limit);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new video
app.post('/api/videos', async (req, res) => {
  try {
    const video = new Video(req.body);
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findOne({ id: req.params.id });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update video
app.patch('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Increment likes
app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ likes: video.likes });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Increment views
app.post('/api/videos/:id/view', async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ views: video.views });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 