#!/usr/bin/env bash
set -e

SERVICE=${1:-gateway}
API_DESC="app/${SERVICE}/desc/${SERVICE}.api"
API_DIR="app/${SERVICE}"

if [ ! -f "$API_DESC" ]; then
    echo "API desc file not found: $API_DESC"
    exit 1
fi

echo "Generating API code for ${SERVICE}..."
goctl api go -api "$API_DESC" -dir "$API_DIR" -style go_zero
echo "Done."
