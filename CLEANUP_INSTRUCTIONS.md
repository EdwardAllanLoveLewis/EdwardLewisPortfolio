Recommended cleanup steps to run locally (PowerShell):

# Remove tracked node_modules and root package-lock.json from git
# These commands remove them from git tracking and delete root package-lock.json; they do not remove server/node_modules

# From the repo root (PowerShell):
# Untrack node_modules and package-lock
git rm -r --cached .\node_modules
git rm --cached .\package-lock.json

# Commit the removal
git commit -m "Stop tracking root node_modules and package-lock.json; prefer server/ for server deps"

# Install server dependencies (if not already):
cd .\server
npm install

# Start the server from the repo root with:
cd ..
npm start

# If you accidentally committed secrets in the past, rotate them immediately and consider using tools like 'git filter-repo' to scrub history.
