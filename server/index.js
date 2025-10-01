const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'posts.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
  } catch (e) {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

app.get('/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

function requireAdmin(req, res, next) {
  const token = req.header('x-admin-token') || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/posts', requireAdmin, (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  const posts = readPosts();
  const post = { id: Date.now().toString(), ts: Date.now(), title, message, comments: [] };
  posts.push(post);
  writePosts(posts);
  res.status(201).json(post);
});

app.delete('/posts/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  let posts = readPosts();
  const before = posts.length;
  posts = posts.filter(p => p.id !== id);
  writePosts(posts);
  res.json({ deleted: before - posts.length });
});

app.post('/posts/:id/comments', (req, res) => {
  const id = req.params.id;
  const { message, parentId, author } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const posts = readPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: 'post not found' });
  const comment = { id: Date.now().toString(), ts: Date.now(), message, author: author || 'Anon', replies: [] };
  if (!parentId) {
    p.comments.push(comment);
  } else {
    const addTo = (list) => {
      for (const c of list) {
        if (c.id === parentId) { c.replies.push(comment); return true; }
        if (c.replies && addTo(c.replies)) return true;
      }
      return false;
    };
    addTo(p.comments);
  }
  writePosts(posts);
  res.status(201).json(comment);
});

app.delete('/posts/:postId/comments/:commentId', requireAdmin, (req, res) => {
  const { postId, commentId } = req.params;
  const posts = readPosts();
  const p = posts.find(x => x.id === postId);
  if (!p) return res.status(404).json({ error: 'post not found' });
  const removeFrom = (list) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === commentId) { list.splice(i,1); return true; }
      if (list[i].replies && removeFrom(list[i].replies)) return true;
    }
    return false;
  };
  const ok = removeFrom(p.comments);
  writePosts(posts);
  res.json({ deleted: ok ? 1 : 0 });
});

const PORT = parseInt(process.env.PORT, 10) || 4000;

function startServer(port, attemptsLeft = 10) {
  const server = app.listen(port, () => console.log(`Blog server listening on http://localhost:${port}`));
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use`);
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.log(`Trying port ${nextPort}... (${attemptsLeft - 1} attempts left)`);
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 200);
      } else {
        console.error('No available ports found, exiting.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
