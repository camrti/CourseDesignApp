#!/bin/bash
# ============================================
# Deploy Script - CourseDesignApp
# ============================================
# Uso: ./deploy.sh [PORTA]
# Esempio: ./deploy.sh        → porta 80
#          ./deploy.sh 8888   → porta 8888
# ============================================

set -e

PORT=${1:-80}
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  CourseDesignApp - Deploy"
echo "=========================================="
echo ""

# 1. Verifica Docker
echo -e "${YELLOW}[1/5] Verifico Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non è installato. Installalo prima: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non è installato.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker OK${NC}"

# 2. Verifica risorse
echo -e "${YELLOW}[2/5] Verifico risorse...${NC}"
FREE_MEM=$(free -m 2>/dev/null | awk '/^Mem:/{print $7}' || echo "unknown")
if [ "$FREE_MEM" != "unknown" ] && [ "$FREE_MEM" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  RAM disponibile: ${FREE_MEM}MB. Consigliati almeno 4GB.${NC}"
else
    echo -e "${GREEN}✅ Risorse OK${NC}"
fi

# 3. Configura porta se diversa da 80
echo -e "${YELLOW}[3/5] Configuro porta ${PORT}...${NC}"
if [ "$PORT" != "80" ]; then
    # Sostituisci la porta nel docker-compose
    if grep -q '"80:3000"' docker-compose.yml; then
        sed -i.bak "s/\"80:3000\"/\"${PORT}:3000\"/" docker-compose.yml
        echo -e "${GREEN}✅ Porta cambiata a ${PORT}${NC}"
    elif grep -q "\"${PORT}:3000\"" docker-compose.yml; then
        echo -e "${GREEN}✅ Porta già configurata su ${PORT}${NC}"
    fi
else
    echo -e "${GREEN}✅ Porta 80 (default)${NC}"
fi

# 4. Build e avvio
echo -e "${YELLOW}[4/5] Build e avvio container (può richiedere alcuni minuti)...${NC}"
docker-compose up -d --build 2>&1

# 5. Verifica
echo -e "${YELLOW}[5/5] Verifico servizi...${NC}"
sleep 10

# Attendi che MongoDB sia healthy
echo "  Attendo MongoDB..."
for i in $(seq 1 30); do
    if docker exec coursedesign-mongodb mongosh --quiet --eval "db.adminCommand('ping')" &>/dev/null; then
        echo -e "  ${GREEN}✅ MongoDB OK${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "  ${YELLOW}⚠️  MongoDB lento ad avviarsi, potrebbe servire ancora un po'${NC}"
    fi
    sleep 2
done

# Attendi SBERT (il più lento)
echo "  Attendo SBERT service (caricamento modello)..."
for i in $(seq 1 60); do
    if curl -s http://localhost:${PORT}/api/microcontents &>/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ API OK${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "  ${YELLOW}⚠️  Servizi ancora in avvio, attendi qualche minuto${NC}"
    fi
    sleep 3
done

# Risultato
echo ""
echo "=========================================="
echo -e "${GREEN}  ✅ Deploy completato!${NC}"
echo ""
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
if [ "$PORT" = "80" ]; then
    echo "  🌐 App:  http://${HOSTNAME}"
else
    echo "  🌐 App:  http://${HOSTNAME}:${PORT}"
fi
echo ""
echo "  Comandi utili:"
echo "    docker-compose logs -f     # Vedi i log"
echo "    docker-compose down        # Ferma tutto"
echo "    docker-compose restart     # Riavvia"
echo "=========================================="
echo ""
