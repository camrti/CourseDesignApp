#!/bin/bash
# ============================================
# Start Local Development (senza Docker per i servizi)
# Solo MongoDB gira in Docker
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Avvio sviluppo locale..."
echo ""

# ---- 1. MongoDB via Docker ----
echo "📦 Avvio MongoDB in Docker..."
docker run -d \
  --name coursedesign-mongodb-local \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=mongodb \
  -e MONGO_INITDB_DATABASE=course_design \
  -p 27017:27017 \
  mongo:7.0 2>/dev/null || echo "   MongoDB già in esecuzione (container esistente)"

# Aspetta che MongoDB sia pronto
echo "   Attendo che MongoDB sia pronto..."
sleep 3
echo "   ✅ MongoDB disponibile su localhost:27017"
echo ""

# ---- 2. Installa dipendenze se necessario ----
echo "📦 Controllo dipendenze..."

if [ ! -d "node_modules" ]; then
  echo "   Installazione dipendenze root..."
  npm install
fi

if [ ! -d "api-gateway/node_modules" ]; then
  echo "   Installazione dipendenze api-gateway..."
  cd api-gateway && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
  echo "   Installazione dipendenze client..."
  cd client && npm install && cd ..
fi

for service in course-service gdta-service recommendation-service microcontent-service; do
  if [ ! -d "services/$service/node_modules" ]; then
    echo "   Installazione dipendenze $service..."
    cd "services/$service" && npm install && cd ../..
  fi
done

echo "   ✅ Dipendenze OK"
echo ""

# ---- 3. SBERT Service (Python) ----
echo "🐍 Avvio SBERT Service (Python) sulla porta 3005..."
if [ ! -d "shared/sbert/venv" ]; then
  echo "   Creazione virtual environment..."
  python3 -m venv shared/sbert/venv
  source shared/sbert/venv/bin/activate
  pip install -r shared/sbert/requirements.txt
  deactivate
fi
source shared/sbert/venv/bin/activate
cd shared/sbert
SBERT_SERVICE_PORT=3005 python sbert_service.py &
SBERT_PID=$!
cd "$PROJECT_ROOT"
deactivate
echo "   ✅ SBERT Service avviato (PID: $SBERT_PID)"
echo ""

# ---- 4. Avvio servizi Node.js ----
echo "🟢 Avvio servizi Node.js..."

cd services/course-service && npx nodemon server.js &
COURSE_PID=$!
echo "   ✅ Course Service (porta 3001, PID: $COURSE_PID)"

cd "$PROJECT_ROOT"
cd services/gdta-service && npx nodemon server.js &
GDTA_PID=$!
echo "   ✅ GDTA Service (porta 3002, PID: $GDTA_PID)"

cd "$PROJECT_ROOT"
cd services/recommendation-service && npx nodemon server.js &
RECOMMENDATION_PID=$!
echo "   ✅ Recommendation Service (porta 3003, PID: $RECOMMENDATION_PID)"

cd "$PROJECT_ROOT"
cd services/microcontent-service && npx nodemon server.js &
MICROCONTENT_PID=$!
echo "   ✅ Microcontent Service (porta 3004, PID: $MICROCONTENT_PID)"

cd "$PROJECT_ROOT"
cd api-gateway && npx nodemon server.js &
GATEWAY_PID=$!
echo "   ✅ API Gateway (porta 8080, PID: $GATEWAY_PID)"

cd "$PROJECT_ROOT"
echo ""

# ---- 5. Avvio Client React ----
echo "⚛️  Avvio Client React (porta 3000)..."
cd client && npm start &
CLIENT_PID=$!
echo "   ✅ Client React avviato (PID: $CLIENT_PID)"

cd "$PROJECT_ROOT"
echo ""
echo "============================================"
echo "🎉 Tutti i servizi sono in esecuzione!"
echo ""
echo "   🌐 Client:          http://localhost:3000"
echo "   🔀 API Gateway:     http://localhost:8080"
echo "   📚 Course Service:  http://localhost:3001"
echo "   🏗️  GDTA Service:    http://localhost:3002"
echo "   💡 Recommendation:  http://localhost:3003"
echo "   📦 Microcontent:    http://localhost:3004"
echo "   🤖 SBERT Service:   http://localhost:3005"
echo "   🗄️  MongoDB:         localhost:27017"
echo ""
echo "   Premi Ctrl+C per fermare tutto"
echo "============================================"

# Trap per cleanup
cleanup() {
  echo ""
  echo "🛑 Arresto servizi..."
  kill $CLIENT_PID $GATEWAY_PID $COURSE_PID $GDTA_PID $RECOMMENDATION_PID $MICROCONTENT_PID $SBERT_PID 2>/dev/null
  echo "   Vuoi fermare anche MongoDB? (y/n)"
  read -r answer
  if [ "$answer" = "y" ]; then
    docker stop coursedesign-mongodb-local 2>/dev/null
    docker rm coursedesign-mongodb-local 2>/dev/null
    echo "   ✅ MongoDB fermato"
  fi
  echo "👋 Bye!"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Attendi
wait
