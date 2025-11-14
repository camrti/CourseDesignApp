#!/bin/bash

echo "=========================================="
echo "GDTA Microlearning - Complete Setup"
echo "=========================================="
echo ""

echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not installed"; exit 1; }
command -v mongod >/dev/null 2>&1 || { echo "ERROR: MongoDB not installed"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: Python 3 not installed"; exit 1; }
echo "Prerequisites OK"
echo ""

echo "[1/5] Creating .env file..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/gdta-microlearning
API_GATEWAY_PORT=8080
GDTA_SERVICE_PORT=3002
COURSE_SERVICE_PORT=3001
RECOMMENDATION_SERVICE_PORT=3003
MICROCONTENT_SERVICE_PORT=3004
REACT_APP_API_BASE_URL=http://localhost:8080/api
NODE_ENV=development
EOF
    echo "   .env created"
else
    echo "   .env already exists"
fi
echo ""

echo "[2/5] Installing dependencies..."
[ -f "package.json" ] && npm install --silent
[ -d "api-gateway" ] && (cd api-gateway && npm install --silent && cd ..)
[ -d "client" ] && (cd client && npm install --silent && cd ..)
[ -d "services/gdta-service" ] && (cd services/gdta-service && npm install --silent && cd ../..)
[ -d "services/course-service" ] && (cd services/course-service && npm install --silent && cd ../..)
[ -d "services/microcontent-service" ] && (cd services/microcontent-service && npm install --silent && cd ../..)
[ -d "services/recommendation-service" ] && (cd services/recommendation-service && npm install --silent && cd ../..)
[ -d "annotation-scripts" ] && (cd annotation-scripts && npm install --silent && cd ..)
echo "   Dependencies installed"
echo ""

echo "[3/5] Creating runtime directories..."
mkdir -p logs pids ~/mongodb-data
chmod +x start-services.sh stop-services.sh 2>/dev/null
echo "   Directories ready"
echo ""

echo "[4/5] Starting MongoDB..."

if command -v brew >/dev/null 2>&1; then
    echo "   Using Homebrew to start MongoDB service..."
    brew services start mongodb-community > /dev/null 2>&1
    sleep 3
else
    if ! pgrep -x "mongod" > /dev/null; then
        echo "   WARNING: Homebrew 'brew' not found."
        echo "   Please start MongoDB manually in ANOTHER terminal window now."
        echo "   Run this command there:"
        echo "   mongod --dbpath ~/mongodb-data"
        echo ""
        echo "   Press Enter here once MongoDB is running..."
        read -r
    fi
fi

if pgrep -x "mongod" > /dev/null; then
    echo "   MongoDB is running"
else
    echo "   ERROR: MongoDB failed to start."
    echo "   Please start it manually and re-run this script."
    echo "   (Command: mongod --dbpath ~/mongodb-data)"
    exit 1
fi
echo ""

echo "[5/5] Starting services and importing data..."
./start-services.sh
sleep 8

echo "   Importing microcontents..."
cd annotation-scripts
node import-to-db.js output/microcontents-real.json > /dev/null 2>&1
cd ..
sleep 3

TOTAL=$(curl -s http://localhost:3004/api/microcontents/embeddings/stats 2>/dev/null | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ "$TOTAL" = "28" ]; then
    echo "   28 microcontents imported successfully"
else
    echo "   WARNING: Could not verify import (found: $TOTAL)"
fi
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next step:"
echo "  cd client && npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""