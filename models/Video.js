const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: String,
    videoPath: String,    // Example: /uploads/videos/video1.mp4
    thumbnailPath: String // Example: /uploads/thumbnails/thumb1.jpg
});

module.exports = mongoose.model('Video', VideoSchema);
