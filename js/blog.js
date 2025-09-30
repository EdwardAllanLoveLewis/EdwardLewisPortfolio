// Client-side blog manager using localStorage.
// Simple, local-only blog for demos and personal notes.

const STORAGE_KEY = 'ed_blog_posts_v1';
// Server base (same origin + /api optional). Adjust if hosting server elsewhere.
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:4000' : '';
// Admin token (optional). Set in browser console for admin actions:
// localStorage.setItem('BLOG_ADMIN_TOKEN', 'your-token-here')
const CLIENT_ADMIN_TOKEN = localStorage.getItem('BLOG_ADMIN_TOKEN') || null;

function $(sel) { return document.querySelector(sel); }

function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

async function fetchPostsFromServer() {
  if (!API_BASE) return null;
  try {
    const res = await fetch(API_BASE + '/posts');
    if (!res.ok) throw new Error('no');
    return await res.json();
  } catch (e) { return null; }
}

async function createPostServer(title, message) {
  if (!API_BASE) throw new Error('no-api');
  const headers = { 'content-type': 'application/json' };
  if (CLIENT_ADMIN_TOKEN) headers['x-admin-token'] = CLIENT_ADMIN_TOKEN;
  const res = await fetch(API_BASE + '/posts', { method: 'POST', headers, body: JSON.stringify({ title, message }) });
  if (!res.ok) throw new Error('create-failed');
  return await res.json();
}

async function deletePostServer(id) {
  if (!API_BASE) throw new Error('no-api');
  const headers = {};
  if (CLIENT_ADMIN_TOKEN) headers['x-admin-token'] = CLIENT_ADMIN_TOKEN;
  const res = await fetch(API_BASE + '/posts/' + id, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('delete-failed');
  return await res.json();
}

async function addCommentServer(postId, message, parentId, author) {
  if (!API_BASE) throw new Error('no-api');
  const headers = { 'content-type': 'application/json' };
  if (CLIENT_ADMIN_TOKEN) headers['x-admin-token'] = CLIENT_ADMIN_TOKEN;
  const res = await fetch(API_BASE + '/posts/' + postId + '/comments', { method: 'POST', headers, body: JSON.stringify({ message, parentId, author }) });
  if (!res.ok) throw new Error('comment-failed');
  return await res.json();
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function render() {
  const postsEl = document.getElementById('posts');
  postsEl.innerHTML = '';
  // Try server first, fall back to local
  fetchPostsFromServer().then(postsData => {
    const posts = postsData || loadPosts();
    if (!posts.length) {
      postsEl.innerHTML = '<div class="card"><p class="muted">No posts yet.</p></div>';
      return;
    }
    posts.slice().reverse().forEach(post => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escapeHtml(post.title)}</strong>
            <div class="muted" style="font-size:0.9em;">${formatDate(post.ts)}</div>
          </div>
          <div>
            <button class="cta delete-post" data-id="${post.id}">Delete</button>
          </div>
        </div>
        <p style="margin-top:0.8em;">${escapeHtml(post.message).replace(/\n/g,'<br>')}</p>
        <div class="comments" data-id="${post.id}" style="margin-top:0.8em"></div>
        <div style="margin-top:0.6em; display:flex; gap:0.5em;">
          <input class="new-comment" data-id="${post.id}" placeholder="Add a comment">
          <button class="cta add-comment" data-id="${post.id}">Comment</button>
        </div>
      `;
      postsEl.appendChild(el);
      renderComments(post.id, post.comments || [], el.querySelector('.comments'));
    });
  });
}

function renderComments(postId, comments, container) {
  container.innerHTML = '';
  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><strong>${escapeHtml(c.author || 'Anon')}</strong> <span class="muted" style="font-size:0.85em;">${formatDate(c.ts)}</span></div>
        <div>
          <button class="cta reply" data-post="${postId}" data-id="${c.id}">Reply</button>
          <button class="cta delete-comment" data-post="${postId}" data-id="${c.id}">Delete</button>
        </div>
      </div>
      <div style="margin-top:0.4em;">${escapeHtml(c.message).replace(/\n/g,'<br>')}</div>
      <div class="replies" style="margin-left:1em; margin-top:0.6em;"></div>
    `;
    container.appendChild(div);
    if (c.replies && c.replies.length) {
      renderReplies(postId, c.replies, div.querySelector('.replies'));
    }
  });
}

function renderReplies(postId, replies, container) {
  container.innerHTML = '';
  replies.forEach(r => {
    const d = document.createElement('div');
    d.className = 'reply';
    d.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><strong>${escapeHtml(r.author || 'Anon')}</strong> <span class="muted" style="font-size:0.85em;">${formatDate(r.ts)}</span></div>
        <div>
          <button class="cta reply" data-post="${postId}" data-id="${r.id}">Reply</button>
          <button class="cta delete-comment" data-post="${postId}" data-id="${r.id}">Delete</button>
        </div>
      </div>
      <div style="margin-top:0.4em;">${escapeHtml(r.message).replace(/\n/g,'<br>')}</div>
      <div class="replies" style="margin-left:1em; margin-top:0.6em;"></div>
    `;
    container.appendChild(d);
    if (r.replies && r.replies.length) renderReplies(postId, r.replies, d.querySelector('.replies'));
  });
}

function escapeHtml(s) {
  return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function findPostById(id) {
  const posts = loadPosts();
  return posts.find(p => p.id === id);
}

function saveNewPost() {
  const title = document.getElementById('postTitle').value.trim();
  const message = document.getElementById('postMessage').value.trim();
  if (!title || !message) return alert('Title and message required');
  if (API_BASE) {
    createPostServer(title, message).then(p => { document.getElementById('postTitle').value=''; document.getElementById('postMessage').value=''; render(); }).catch(() => {
      const posts = loadPosts(); const post = { id: Date.now().toString(), ts: Date.now(), title, message, comments: [] }; posts.push(post); savePosts(posts); document.getElementById('postTitle').value=''; document.getElementById('postMessage').value=''; render();
    });
  } else {
    const posts = loadPosts(); const post = { id: Date.now().toString(), ts: Date.now(), title, message, comments: [] }; posts.push(post); savePosts(posts); document.getElementById('postTitle').value=''; document.getElementById('postMessage').value=''; render();
  }
}

function clearAllPosts() {
  if (!confirm('Clear all posts? This cannot be undone.')) return;
  if (API_BASE) {
    // no server endpoint for clearing all—fall back to local
    localStorage.removeItem(STORAGE_KEY);
    render();
  } else {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
}

function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  if (API_BASE) {
    deletePostServer(postId).then(()=> render()).catch(()=> { let posts = loadPosts(); posts = posts.filter(p=>p.id!==postId); savePosts(posts); render(); });
  } else {
    let posts = loadPosts(); posts = posts.filter(p => p.id !== postId); savePosts(posts); render();
  }
}

function addComment(postId, message, parentId=null, author='Anon') {
  if (API_BASE) {
    addCommentServer(postId, message, parentId, author).then(()=> render()).catch(()=> {
      const posts = loadPosts(); const p = posts.find(x => x.id === postId); if (!p) return; const comment = { id: Date.now().toString(), ts: Date.now(), message, author, replies: [] }; if (!parentId) { p.comments.push(comment); } else { const addTo = (list) => { for (const c of list) { if (c.id === parentId) { c.replies.push(comment); return true; } if (c.replies && addTo(c.replies)) return true; } return false; }; addTo(p.comments); } savePosts(posts); render();
    });
  } else {
    const posts = loadPosts();
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    const comment = { id: Date.now().toString(), ts: Date.now(), message, author, replies: [] };
    if (!parentId) {
      p.comments.push(comment);
    } else {
      // recursive search to add to parent replies
      const addTo = (list) => {
        for (const c of list) {
          if (c.id === parentId) { c.replies.push(comment); return true; }
          if (c.replies && addTo(c.replies)) return true;
        }
        return false;
      };
      addTo(p.comments);
    }
    savePosts(posts);
    render();
  }
}

function deleteComment(postId, commentId) {
  const posts = loadPosts();
  const p = posts.find(x => x.id === postId);
  if (!p) return;
  const removeFrom = (list) => {
    for (let i=0;i<list.length;i++) {
      if (list[i].id === commentId) { list.splice(i,1); return true; }
      if (list[i].replies && removeFrom(list[i].replies)) return true;
    }
    return false;
  };
  removeFrom(p.comments);
  savePosts(posts);
  render();
}

// Event delegation
window.addEventListener('click', async (e) => {
  const t = e.target;
  if (t.matches('#createPost')) { saveNewPost(); }
  if (t.matches('#clearPosts')) { clearAllPosts(); }
  if (t.matches('.delete-post')) { const id = t.dataset.id; deletePost(id); }
  if (t.matches('.add-comment')) {
    const id = t.dataset.id;
    const input = document.querySelector(`.new-comment[data-id="${id}"]`);
    if (!input) return;
    const v = input.value.trim();
    if (!v) return;
    addComment(id, v);
  }
  if (t.matches('.reply')) {
    const postId = t.dataset.post;
    const parentId = t.dataset.id;
    const txt = prompt('Reply message:');
    if (!txt) return;
    addComment(postId, txt, parentId);
  }
  if (t.matches('.delete-comment')) {
    const postId = t.dataset.post;
    const commentId = t.dataset.id;
    if (!confirm('Delete this comment?')) return;
    deleteComment(postId, commentId);
  }
});

// bootstrap
render();