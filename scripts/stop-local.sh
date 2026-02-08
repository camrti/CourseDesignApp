#!/bin/bash
# Ferma MongoDB locale in Docker
echo "🛑 Arresto MongoDB locale..."
docker stop coursedesign-mongodb-local 2>/dev/null
docker rm coursedesign-mongodb-local 2>/dev/null
echo "✅ MongoDB fermato e rimosso"
