FROM node:20-bookworm

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    mariadb-server \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

RUN chmod +x docker/entrypoint.sh

VOLUME ["/var/lib/mysql"]

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["sh", "-c", "npm run deploy && npm start"]
