FROM node:8

WORKDIR /opt/example

# install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install strip-ansi -g && npm install -g npm@6.3 && npm ci --only=production

# copy code
COPY server ./

EXPOSE 8080
CMD node index.js
