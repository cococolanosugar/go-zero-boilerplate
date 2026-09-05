#!/usr/bin/env bash
set -e

SERVICE=${1:-user}
RPC_DIR="app/${SERVICE}/rpc"
PROTO_FILE="${SERVICE}.proto"

if [ ! -f "${RPC_DIR}/${PROTO_FILE}" ]; then
    echo "Proto file not found: ${RPC_DIR}/${PROTO_FILE}"
    exit 1
fi

echo "Generating RPC code for ${SERVICE}..."
cd "${RPC_DIR}"
goctl rpc protoc "${PROTO_FILE}" --go_out=. --go-grpc_out=. --zrpc_out=. -m
echo "Done."
