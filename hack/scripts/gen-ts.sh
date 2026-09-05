#!/usr/bin/env bash
set -e

API_DESC="app/gateway/desc/gateway.api"
TARGET_DIR="frontend/packages/api/src"

if [ ! -f "$API_DESC" ]; then
    echo "Gateway API desc file not found: $API_DESC"
    exit 1
fi

echo "Generating TypeScript SDK from ${API_DESC}..."
goctl api ts --api "$API_DESC" --dir "$TARGET_DIR"

if [ ! -f "${TARGET_DIR}/index.ts" ]; then
    echo "export * from './gateway';" > "${TARGET_DIR}/index.ts"
    echo "export * from './gatewayComponents';" >> "${TARGET_DIR}/index.ts"
    echo "export * from './gocliRequest';" >> "${TARGET_DIR}/index.ts"
fi

echo "Done."
