FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip python3-dev g++ gcc build-essential && rm -rf /var/lib/apt/lists/*

COPY services/microcontent-service/package*.json ./

RUN npm install --only=production

COPY services/microcontent-service/ ./

COPY shared/sbert/ ./shared/sbert/

RUN pip3 install --no-cache-dir -r ./shared/sbert/requirements.txt --break-system-packages

RUN mkdir -p media

EXPOSE 3004

CMD ["node", "server.js"]
