const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/User');
const Video = require('./models/Video');

const app = express();
const ADMIN_EMAIL = "02fe23bcs000@kletech.ac.in"; 

mongoose.connect('mongodb://127.0.0.1:27017/nebulastream');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'nebula-secret-key',
    resave: false,
    saveUninitialized: false
}));

// --- AUTH MIDDLEWARE ---
const isAdmin = (req, res, next) => {
    if (req.session.email === ADMIN_EMAIL) next();
    else res.status(403).send("Only Admin can upload.");
};

// --- AUTH ROUTES ---
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ email: req.body.email, password: hashedPassword });
        await user.save();
        res.redirect('/login.html');
    } catch { res.status(400).send("Account exists."); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        req.session.email = user.email;
        res.redirect('/dashboard.html');
    } else { res.status(401).send("Invalid credentials."); }
});

app.get('/api/check-auth', (req, res) => {
    res.json({ isLoggedIn: !!req.session.userId, isAdmin: req.session.email === ADMIN_EMAIL });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- VIDEO ROUTES ---
app.get('/api/videos', async (req, res) => {
    const videos = await Video.find();
    res.json(videos);
});

app.get('/api/video/:id', async (req, res) => {
    const video = await Video.findById(req.params.id);
    res.json(video);
});

app.get('/watch/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// --- UPLOAD ROUTES ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "video") cb(null, 'public/uploads/videos/');
        else cb(null, 'public/uploads/thumbnails/');
    },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

app.post('/upload', isAdmin, upload.fields([{ name: 'video' }, { name: 'thumbnail' }]), async (req, res) => {
    const newVideo = new Video({
        title: req.body.title,
        videoPath: '/uploads/videos/' + req.files['video'][0].filename,
        thumbnailPath: '/uploads/thumbnails/' + req.files['thumbnail'][0].filename
    });
    await newVideo.save();
    res.redirect('/dashboard.html');
});

app.listen(3000, () => console.log("NebulaStream Fully Restored on 3000"));
