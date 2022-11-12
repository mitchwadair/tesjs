#!/usr/bin/env bash

git config core.autocrlf true

echo $(git diff --name-only)
CHANGED=$(git diff --name-only | grep "checksum")

if [[ -n "$CHANGED" ]]; then
    echo "checksum changed from build, run 'npm run build' to commit new build"
    exit 1
else
    exit 0
fi