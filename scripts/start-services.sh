#!/bin/bash

echo "Starting microservices..."

mkdir -p logs

echo "Starting GDTA Service on port 3002..."
cd services/gdta-service
npm run dev > ../../logs/gdta.log 2>&1 &
echo $! > ../../pids/gdta.pid
cd ../..
sleep 2

echo "Starting Course Service on port 3001..."
cd services/course-service
npm run dev > ../../logs/course.log 2>&1 &
echo $! > ../../pids/course.pid
cd ../..
sleep 2

echo "Starting Recommendation Service on port 3003..."
cd services/recommendation-service
npm run dev > ../../logs/recommendation.log 2>&1 &
echo $! > ../../pids/recommendation.pid
cd ../..
sleep 2

echo "Starting Microcontent Service on port 3004..."
cd services/microcontent-service
npm run dev > ../../logs/microcontent.log 2>&1 &
echo $! > ../../pids/microcontent.pid
cd ../..
sleep 2

if [ -d "api-gateway" ]; then
    echo "Starting API Gateway on port 8080..."
    cd api-gateway
    npm run dev > ../logs/gateway.log 2>&1 &
    echo $! > ../pids/gateway.pid
    cd ..
    sleep 3
fi

echo "All services started."
echo "GDTA Service: http://localhost:3002"
echo "Course Service: http://localhost:3001" 
echo "Recommendation Service: http://localhost:3003"
echo "Microcontent Service: http://localhost:3004"
if [ -d "api-gateway" ]; then
    echo "API Gateway: http://localhost:8080"
fi
echo "Logs are in ./logs/ directory"
echo "To stop services: ./stop-services.sh"