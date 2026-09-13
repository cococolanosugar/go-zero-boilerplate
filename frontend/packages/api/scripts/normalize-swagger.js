const fs = require('fs');
const path = require('path');

const swaggerPath = path.resolve(__dirname, '../../../../manifest/swagger/gateway.json');
const adminOpenApiPath = path.resolve(__dirname, '../../../apps/admin/public/openapi.json');

if (!fs.existsSync(swaggerPath)) {
  console.error(`Swagger file not found at ${swaggerPath}`);
  process.exit(1);
}

const swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

for (const [routePath, methods] of Object.entries(swagger.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
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
        .replace(/[\/\-_](\w)/g, (_, c) => c.toUpperCase())
        .replace(/[\/\-_]/g, '');
    }
  }
}

fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2), 'utf-8');
console.log(`[normalize-swagger] Successfully normalized tags & operationIds in ${swaggerPath}`);

// Ensure admin openapi.json is in sync
if (fs.existsSync(path.dirname(adminOpenApiPath))) {
  fs.copyFileSync(swaggerPath, adminOpenApiPath);
  console.log(`[normalize-swagger] Synchronized to ${adminOpenApiPath}`);
}
