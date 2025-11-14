#!/bin/bash

echo "Stopping all services..."

for service in gdta course recommendation microcontent gateway; do
    if [ -f "${service}.pid" ]; then
        pid=$(cat "${service}.pid")
        echo "Stopping ${service} service (PID: ${pid})"
        kill $pid 2>/dev/null
        rm "${service}.pid"
    fi
done

echo "Cleaning up any remaining processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:3003 | xargs kill -9 2>/dev/null
lsof -ti:3004 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "All services stopped."