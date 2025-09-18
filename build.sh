#!/bin/bash

# Grouper Deployment Script
# Updates version in package.json, builds the project, and commits/pushes changes
# Usage: ./build.sh [major|minor|patch]
# Default: patch

set -e

# Parse version type argument (default to patch)
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "❌ Error: Invalid version type. Use 'major', 'minor', or 'patch'"
    echo "Usage: ./deploy.sh [major|minor|patch]"
    exit 1
fi

echo "🚀 Starting Grouper deployment (${VERSION_TYPE} version bump)..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# Function to increment version based on semver
increment_version() {
    local version=$1
    local type=$2

    # Extract major, minor, patch from version string
    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch=$(echo $version | cut -d. -f3)

    case $type in
    major)
        major=$((major + 1))
        minor=0
        patch=0
        ;;
    minor)
        minor=$((minor + 1))
        patch=0
        ;;
    patch)
        patch=$((patch + 1))
        ;;
    esac

    echo "${major}.${minor}.${patch}"
}

# Get current version from package.json
echo "📋 Reading current version from package.json..."
CURRENT_VERSION=$(grep '"version"' package.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Error: Could not read version from package.json"
    exit 1
fi

echo "   Current version: $CURRENT_VERSION"

# Calculate new version
NEW_VERSION=$(increment_version $CURRENT_VERSION $VERSION_TYPE)
echo "   New version: $NEW_VERSION"

# Update version in package.json
echo "🔄 Updating package.json with new version..."
sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"$NEW_VERSION\"/g" package.json
rm -f package.json.bak

# Update package-lock.json with new version
echo "🔄 Updating package-lock.json with new version..."
npm install --package-lock-only --silent

# Build the project
echo "🔨 Building the project..."
if ! npm run build; then
    echo "❌ Error: Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if there are any changes to commit
if git diff --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Add files to git
echo "📦 Adding files to git..."
git add package.json package-lock.json

# Create commit message
COMMIT_MSG="Release v${NEW_VERSION}

- Version bump: ${CURRENT_VERSION} → ${NEW_VERSION} (${VERSION_TYPE})
- Project built and ready for deployment"

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push to origin
echo "🌐 Pushing to origin..."
git push origin

echo "✅ Build complete!"
echo "   Version: ${CURRENT_VERSION} → ${NEW_VERSION} (${VERSION_TYPE})"
echo "   Build output available in 'build' directory"
echo "   Changes committed and pushed to origin"
