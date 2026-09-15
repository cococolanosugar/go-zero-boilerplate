const fs = require('fs');
const path = require('path');

const openApiPath = path.resolve(__dirname, '../../../../manifest/openapi/openapi.json');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI file not found at ${openApiPath}`);
  process.exit(1);
}

const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

for (const [routePath, methods] of Object.entries(openApi.paths || {})) {
  for (const op of Object.values(methods)) {
    if (!op || typeof op !== 'object') {
      continue;
    }

    let tag = 'other';
    if (routePath.startsWith('/api/v1/dashboard')) {
      tag = 'dashboard';
    } else if (
      routePath.startsWith('/api/v1/portal/navigation') ||
      routePath.startsWith('/api/v1/system/navigation')
    ) {
      tag = 'navigation';
    } else if (routePath.startsWith('/api/v1/system/dict')) {
      tag = 'dict';
    } else if (routePath.startsWith('/api/v1/system/task')) {
      tag = 'task';
    } else if (routePath.startsWith('/api/v1/system')) {
      tag = 'system';
    } else if (routePath.startsWith('/api/v1/user')) {
      tag = 'user';
    }

    op.tags = [tag];

    if (op.operationId) {
      op.operationId = op.operationId
        .replace(/[\/_-](\w)/g, (_, c) => c.toUpperCase())
        .replace(/[\/_-]/g, '');
    }
  }
}

fs.writeFileSync(openApiPath, JSON.stringify(openApi, null, 2), 'utf-8');
console.log(`[normalize-openapi] Successfully normalized tags & operationIds in ${openApiPath}`);
