#!/usr/bin/env bash
set -e

TABLE=${1:-"all"}

if [ "$TABLE" = "all" ] || [ "$TABLE" = "user" ]; then
    echo "Generating user model from manifest/sql/user.sql..."
    goctl model mysql ddl -src manifest/sql/user.sql -dir app/user/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "rbac" ] || [ "$TABLE" = "system" ]; then
    echo "Generating RBAC and system models from manifest/sql/rbac_schema.sql..."
    goctl model mysql ddl -src manifest/sql/rbac_schema.sql -dir app/user/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "dict" ]; then
    echo "Generating Dict models from manifest/sql/dict_schema.sql..."
    goctl model mysql ddl -src manifest/sql/dict_schema.sql -dir app/user/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "log" ]; then
    echo "Generating Audit Log models from manifest/sql/log_schema.sql..."
    goctl model mysql ddl -src manifest/sql/log_schema.sql -dir app/user/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "itsm" ]; then
    echo "Generating ITSM models from manifest/sql/itsm_schema.sql..."
    goctl model mysql ddl -src manifest/sql/itsm_schema.sql -dir app/itsm/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "devops" ] || [ "$TABLE" = "titan" ]; then
    echo "Generating Titan models from manifest/sql/titan_schema.sql..."
    goctl model mysql ddl -src manifest/sql/titan_schema.sql -dir app/titan/model -c --style go_zero
fi

echo "Done generating database models!"
