#!/usr/bin/env bash
set -euo pipefail

ZIP_NAME="ai-voice-sales-agent.zip"

# Create distribution zip without dependencies, git metadata, runtime folders, or secrets.
zip -r "$ZIP_NAME" . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x ".env" \
  -x "output/*" \
  -x "uploads/*" \
  -x "$ZIP_NAME"

echo "Created: $(pwd)/$ZIP_NAME"
