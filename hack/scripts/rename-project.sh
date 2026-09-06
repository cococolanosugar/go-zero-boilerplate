#!/usr/bin/env bash
set -e

NEW_MODULE=${1}
DISPLAY_NAME=${2}

if [ -z "$NEW_MODULE" ]; then
    echo "Usage: ./hack/scripts/rename-project.sh <new_module_name> [display_name]"
    echo "Example: ./hack/scripts/rename-project.sh my-company/order-system 'Order System'"
    exit 1
fi

# 定位工程根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_ROOT}"

if [ ! -f "go.mod" ]; then
    echo "Error: go.mod not found in ${PROJECT_ROOT}. Please run from project root."
    exit 1
fi

OLD_MODULE="go-zero-boilerplate"
OLD_DB_NAME="go_zero_boilerplate"
OLD_DISPLAY_NAME="Go-Zero Boilerplate"

# 计算简短名称与数据库名称
NEW_SHORT_NAME=$(basename "${NEW_MODULE}")
NEW_DB_NAME="${NEW_SHORT_NAME//-/_}"

if [ -z "$DISPLAY_NAME" ]; then
    DISPLAY_NAME="${NEW_SHORT_NAME}"
fi

echo "================================================="
echo "       Go-Zero Boilerplate Project Rebranding    "
echo "================================================="
echo "Old Module:      ${OLD_MODULE}"
echo "New Module:      ${NEW_MODULE}"
echo "New Short Name:  ${NEW_SHORT_NAME}"
echo "New Database:    ${NEW_DB_NAME}"
echo "New Display:     ${DISPLAY_NAME}"
echo "-------------------------------------------------"

# 通用安全替换函数（避免 macOS 与 Linux sed -i 差异）
replace_text() {
    local search="$1"
    local replace="$2"
    local file="$3"

    if [ -f "$file" ]; then
        if grep -q "$search" "$file" 2>/dev/null; then
            awk -v s="$search" -v r="$replace" '{gsub(s, r); print}' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
            echo "  Updated: $file"
        fi
    fi
}

# 1. 替换 go.mod 与所有 Go 代码中的 module 及 import
echo "Updating Go module and imports..."
replace_text "${OLD_MODULE}" "${NEW_MODULE}" "go.mod"
find . -type f -name "*.go" ! -path "*/vendor/*" ! -path "*/.git/*" | while read -r file; do
    replace_text "${OLD_MODULE}" "${NEW_MODULE}" "$file"
done

# 2. 替换 YAML 配置与 Docker Compose
echo "Updating YAML configuration and Docker Compose files..."
find . -type f \( -name "*.yaml" -o -name "*.yml" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | while read -r file; do
    replace_text "${OLD_MODULE}" "${NEW_SHORT_NAME}" "$file"
    replace_text "${OLD_DB_NAME}" "${NEW_DB_NAME}" "$file"
done

# 3. 替换 SQL 脚本中的数据库名
echo "Updating SQL schema files..."
find manifest/sql -type f -name "*.sql" 2>/dev/null | while read -r file; do
    replace_text "${OLD_DB_NAME}" "${NEW_DB_NAME}" "$file"
done

# 4. 替换前端工程与标题配置
echo "Updating Frontend packages and UI constants..."
replace_text "${OLD_MODULE}" "${NEW_SHORT_NAME}" "frontend/package.json"
replace_text "${OLD_DISPLAY_NAME}" "${DISPLAY_NAME}" "frontend/packages/shared/src/index.ts"
replace_text "${OLD_DISPLAY_NAME}" "${DISPLAY_NAME}" "frontend/apps/portal/src/pages/Services/index.tsx"

# 5. 替换构建配置 (justfile, Makefile)
echo "Updating Build configs (justfile, Makefile)..."
replace_text "${OLD_MODULE}" "${NEW_SHORT_NAME}" "justfile"
replace_text "${OLD_DB_NAME}" "${NEW_DB_NAME}" "justfile"
replace_text "${OLD_MODULE}" "${NEW_SHORT_NAME}" "Makefile"
replace_text "${OLD_DB_NAME}" "${NEW_DB_NAME}" "Makefile"

echo "-------------------------------------------------"
echo "Project successfully rebranded to '${NEW_MODULE}'!"
echo "Next recommended steps:"
echo "  1. Run 'go mod tidy' to refresh dependencies"
echo "  2. Run 'just gen-gateway' to update API routes"
echo "  3. Run 'just test' to verify test cases"
echo "================================================="
