#!/usr/bin/env bash

git config --local core.autocrlf false

CHANGED=$(git diff --name-only | grep "checksum")

if [[ -n "$CHANGED" ]]; then
    echo "checksum changed from build, run 'npm run build' to commit new build"
    exit 1
else
    exit 0
fi