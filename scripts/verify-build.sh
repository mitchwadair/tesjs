#!/usr/bin/env bash

git config --local core.autocrlf false
git config --local core.safecrlf false

CHANGED=$(git diff --name-only | grep -w "dist/tes.min.js")

if [[ -n "$CHANGED" ]]; then
    echo "build changed, run 'npm run build' to commit new build"
    exit 1
else
    echo "builds match, build is up to date"
    exit 0
fi