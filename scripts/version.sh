#!/bin/bash
# Version management script for RackView

set -e

VERSION_FILE="VERSION"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Function to get current version
get_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "0.0.0"
    fi
}

# Function to set version
set_version() {
    local new_version=$1
    echo "$new_version" > "$VERSION_FILE"
    echo "Version set to: $new_version"
}

# Function to bump version
bump_version() {
    local part=$1  # major, minor, patch
    local current=$(get_version)
    IFS='.' read -ra VERSION_PARTS <<< "$current"
    
    local major=${VERSION_PARTS[0]:-0}
    local minor=${VERSION_PARTS[1]:-0}
    local patch=${VERSION_PARTS[2]:-0}
    
    case $part in
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
        *)
            echo "Invalid version part: $part. Use: major, minor, or patch"
            exit 1
            ;;
    esac
    
    local new_version="$major.$minor.$patch"
    set_version "$new_version"
    echo "$new_version"
}

# Function to create git tag
create_tag() {
    local version=$(get_version)
    local tag="v$version"
    
    if git rev-parse "$tag" >/dev/null 2>&1; then
        echo "Tag $tag already exists"
        exit 1
    fi
    
    git tag -a "$tag" -m "Release version $version"
    echo "Created tag: $tag"
    echo "Push with: git push origin $tag"
}

# Main command handling
case "${1:-}" in
    get)
        get_version
        ;;
    set)
        if [ -z "$2" ]; then
            echo "Usage: $0 set <version>"
            exit 1
        fi
        set_version "$2"
        ;;
    bump)
        if [ -z "$2" ]; then
            echo "Usage: $0 bump <major|minor|patch>"
            exit 1
        fi
        bump_version "$2"
        ;;
    tag)
        create_tag
        ;;
    *)
        echo "Usage: $0 {get|set|bump|tag}"
        echo ""
        echo "Commands:"
        echo "  get              - Get current version"
        echo "  set <version>    - Set version (e.g., 1.2.3)"
        echo "  bump <part>      - Bump version (major|minor|patch)"
        echo "  tag              - Create git tag for current version"
        echo ""
        echo "Examples:"
        echo "  $0 get                    # Get current version"
        echo "  $0 set 1.2.3             # Set version to 1.2.3"
        echo "  $0 bump patch            # Bump patch version (1.2.3 -> 1.2.4)"
        echo "  $0 bump minor            # Bump minor version (1.2.3 -> 1.3.0)"
        echo "  $0 bump major            # Bump major version (1.2.3 -> 2.0.0)"
        echo "  $0 tag                   # Create git tag v1.2.3"
        exit 1
        ;;
esac
