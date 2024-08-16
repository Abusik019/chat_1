const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/chat', (req, res) => {
  res.render('chat');
});

router.post('/upload', upload.single('file'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  const username = req.body.username;
  const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'file';

  req.app.get('io').emit('newMessage', { type: fileType, url: filePath, username });
  res.status(200).json({ url: filePath });
});

router.post('/message', (req, res) => {
  const { message, username } = req.body;
  req.app.get('io').emit('newMessage', { type: 'text', content: message, username });
  res.sendStatus(200);
});

module.exports = router;
