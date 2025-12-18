#!/bin/bash
# ============================================================
#  ORBOS - Auto-Sync Latest Work
#  Run this when you start a new session to get all your files
# ============================================================

echo "🔄 Syncing latest ORBOS work..."

# Fetch all branches
git fetch origin

# Find the latest claude branch with work
LATEST_BRANCH=$(git branch -r --sort=-committerdate | grep claude | head -1 | sed 's/origin\///' | xargs)

if [ -n "$LATEST_BRANCH" ]; then
    echo "📂 Found latest branch: $LATEST_BRANCH"
    git checkout "$LATEST_BRANCH" 2>/dev/null || git checkout -b "$LATEST_BRANCH" "origin/$LATEST_BRANCH"
    git pull origin "$LATEST_BRANCH"
    echo "✅ Synced! All your files are here."
else
    echo "⚠️  No claude branches found"
fi

# Show what we have
echo ""
echo "📊 Current status:"
echo "   Branch: $(git branch --show-current)"
echo "   Files: $(find system -name '*.js' 2>/dev/null | wc -l) JS files in system/"
echo "   Latest commit: $(git log -1 --oneline)"
