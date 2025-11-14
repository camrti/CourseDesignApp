#!/bin/bash

echo "=========================================="
echo "GDTA Microlearning - Complete Cleanup"
echo "=========================================="
echo ""
echo "This will remove:"
echo "  - All node_modules"
echo "  - Runtime files (logs, pids)"
echo "  - .env file"
echo "  - MongoDB database (manual step)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

echo "1/8 Stopping all services..."
if [ -f "stop-services.sh" ]; then
    ./stop-services.sh 2>/dev/null
fi
killall node 2>/dev/null
sleep 2

echo "2/8 Freeing ports..."
lsof -ti:3000,3001,3002,3003,3004,8080 2>/dev/null | xargs kill -9 2>/dev/null

echo "3/8 Stopping MongoDB..."
killall mongod 2>/dev/null
sleep 2

echo "4/8 Removing node_modules..."
rm -rf node_modules
rm -rf api-gateway/node_modules
rm -rf client/node_modules
rm -rf services/gdta-service/node_modules
rm -rf services/course-service/node_modules
rm -rf services/microcontent-service/node_modules
rm -rf services/recommendation-service/node_modules
rm -rf annotation-scripts/node_modules

echo "5/8 Removing runtime files..."
rm -rf logs/
rm -rf pids/
rm -f *.log
rm -f pids/*.pid 2>/dev/null

echo "6/8 Removing .env file..."
rm -f .env

echo "7/8 MongoDB database cleanup..."
echo "    Run manually to drop database:"
echo "    mongosh"
echo "    use gdta-microlearning"
echo "    db.dropDatabase()"
echo "    exit"
echo ""

echo "8/8 Checking package-lock.json files..."
read -p "Remove package-lock.json files? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "    Removing package-lock.json files..."
    find . -name "package-lock.json" -type f -delete
    echo "    Done."
fi

echo ""
echo "=========================================="
echo "Cleanup completed!"
echo "=========================================="
echo ""
echo "To restart the system:"
echo "  1. Create .env file in root"
echo "  2. Run: ./setup.sh"
echo "  3. Start MongoDB: mongod --dbpath ~/mongodb-data"
echo "  4. Import data: cd annotation-scripts && node import-to-db.js output/microcontents-real.json"
echo "  5. Start services: ./start-services.sh"
echo "  6. Start client: cd client && npm start"
echo ""