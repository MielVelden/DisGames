FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    wget gnupg lsb-release \
    && wget -q https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb -O /tmp/mysql-apt-config.deb \
    && DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/mysql-apt-config.deb \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server \
    && rm -rf /var/lib/apt/lists/* /tmp/mysql-apt-config.deb

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

RUN chmod +x docker/entrypoint.sh

VOLUME ["/var/lib/mysql"]

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["sh", "-c", "npm run deploy && npm start"]
