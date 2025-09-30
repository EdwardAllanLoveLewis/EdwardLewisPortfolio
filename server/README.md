Simple blog backend for EdwardLewisPortfolio

Usage

1. Install dependencies:

   npm install

2. Start the server (set a secure ADMIN_TOKEN):

   set ADMIN_TOKEN=yourtoken; node index.js   (Windows PowerShell: $env:ADMIN_TOKEN='yourtoken'; node index.js)

3. The server runs on port 4000 by default. Endpoints:

- GET  /posts                      -> returns all posts
- POST /posts                      -> create a post (requires x-admin-token header or ?token=)
- DELETE /posts/:id                -> delete a post (admin)
- POST /posts/:id/comments         -> add a comment to post
- DELETE /posts/:postId/comments/:commentId  -> delete comment (admin)




Notes
- This server uses file-based storage (posts.json) and is intended for small personal sites and demos only.
