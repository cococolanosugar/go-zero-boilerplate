#!/usr/bin/env bash
set -e

SERVICE="$1"
if [ -z "$SERVICE" ]; then
    echo "Error: Service name is required. Usage: ./new-api.sh <service_name>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TARGET_DIR="${ROOT}/app/${SERVICE}"
API_DIR="${TARGET_DIR}/api"
TEMPLATE_DIR="${ROOT}/hack/template"

if [ -d "${API_DIR}" ]; then
    echo "Error: API service already exists at ${API_DIR}"
    exit 1
fi

# 确保模板目录存在
if [ ! -d "${TEMPLATE_DIR}" ]; then
    echo "Initializing templates in ${TEMPLATE_DIR}..."
    goctl template init --home "${TEMPLATE_DIR}"
fi

# 确保 app/${SERVICE} 目录存在
mkdir -p "${TARGET_DIR}"

echo "Creating new API service '${SERVICE}' in app/${SERVICE}..."
cd "${TARGET_DIR}"

# 进入 app/${SERVICE} 执行 goctl api new
goctl api new "${SERVICE}" --home ../../hack/template

GENERATED_DIR="${TARGET_DIR}/${SERVICE}"
if [ ! -d "${GENERATED_DIR}" ]; then
    echo "Error: Generated directory ${GENERATED_DIR} not found."
    exit 1
fi

# 将生成目录重命名为 api
mv "${GENERATED_DIR}" "${API_DIR}"

# 自动修正 goctl 相对生成导入路径: app/${SERVICE}/${SERVICE} -> app/${SERVICE}/api
if command -v node >/dev/null 2>&1; then
    node -e "
    const fs = require('fs');
    const path = require('path');
    function walk(dir) {
        for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, file.name);
            if (file.isDirectory()) walk(full);
            else if (file.name.endsWith('.go')) {
                const c = fs.readFileSync(full, 'utf8');
                if (c.includes('app/${SERVICE}/${SERVICE}')) {
                    fs.writeFileSync(full, c.split('app/${SERVICE}/${SERVICE}').join('app/${SERVICE}/api'), 'utf8');
                }
            }
        }
    }
    walk('api');
    "
fi

echo "Done! API service '${SERVICE}' created successfully at app/${SERVICE}/api"
