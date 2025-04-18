#!/usr/bin/env bash

# Set the root directory
ROOT="$PWD"
PROJECT_FOLDERS=("./" "./apps/*" "./packages/**/*" "./services/*")

# Check if ncu is installed
if ! command -v npx npm-check-updates &>/dev/null; then
    echo "ncu (npm-check-updates) is not installed. Please install it first."
    exit 1
fi

# Variable to track if updates were made
UPDATES_MADE=false

# Process each project folder
for d in ${PROJECT_FOLDERS[@]}; do
    # Check if directory exists
    if [ -d "$d" ]; then
        echo "Checking $d"
        cd "$d" || {
            echo "Failed to change directory to $d"
            continue
        }

        # Run ncu and update packages
        if npx npm-check-updates -u; then
            echo "Dependencies updated in $d"
            UPDATES_MADE=true
        else
            echo "Error updating dependencies in $d"
        fi

        # Return to the root directory
        cd "$ROOT" || {
            echo "Failed to return to root directory"
            exit 1
        }
    else
        echo "Directory $d does not exist"
    fi
done

# Check if any git changes are present
if [[ $UPDATES_MADE == true && $(git status --porcelain --untracked-files=no | wc -l) -gt 0 ]]; then
    echo "⤴️ Updated dependencies in $ROOT"
else
    echo "✅ No Updates for $ROOT"
fi
