#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-}"
TABLE="${2:-}"
DSN="${3:-root:root@tcp(127.0.0.1:3306)/go_zero_boilerplate}"

if [[ -z "$SERVICE" || -z "$TABLE" ]]; then
    echo "Usage: ./hack/scripts/gen-crud.sh <service> <table> [dsn]"
    exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> [gen-crud] 正在运行全栈代码生成器 (服务: $SERVICE, 表: $TABLE)..."
go run ./hack/generator -service "$SERVICE" -table "$TABLE" -dsn "$DSN" -out "$ROOT_DIR"
