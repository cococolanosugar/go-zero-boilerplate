#!/usr/bin/env bash
set -e

TABLE=${1:-"all"}

if [ "$TABLE" = "all" ] || [ "$TABLE" = "user" ]; then
    echo "Generating user model from manifest/sql/user.sql..."
    goctl model mysql ddl -src manifest/sql/user.sql -dir app/user/model -c --style go_zero
fi

if [ "$TABLE" = "all" ] || [ "$TABLE" = "order" ]; then
    echo "Generating orders model from manifest/sql/order.sql..."
    goctl model mysql ddl -src manifest/sql/order.sql -dir app/order/model -c --style go_zero
fi

echo "Done generating database models!"
