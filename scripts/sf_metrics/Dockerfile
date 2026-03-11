FROM node:25-alpine as build
# create app directory and cd to it
WORKDIR /app
# Copy the package files
COPY ./package*.json ./.npmrc ./
COPY ./server/package.json ./server/package.json
COPY ./packages/data-utils/package.json ./packages/data-utils/package.json
COPY ./packages/page-parts/package.json ./packages/page-parts/package.json
COPY ./ui/metrics/package.json ./ui/metrics/package.json
# Set Certificate so things work
# COPY ./scripts/cert.pem ./scripts/cert.pem
# ENV NODE_EXTRA_CA_CERTS="/app/scripts/cert.pem"
RUN npm config set update-notifier=false loglevel=error
# NPM Install
RUN npm ci
# Copy the rest of the source files
COPY ./tsconfig*.json ./
COPY ./server ./server
COPY ./packages ./packages
COPY ./ui/metrics ./ui/metrics
# Build the Packages
RUN npm run build -w=@spcs-apps/data-utils
RUN npm run build -w=@spcs-apps/page-parts
# Build the UI
RUN npm run build -w=@spcs-apps/metrics
# Build the Server
RUN npm run build -w=@spcs-apps/server
# Remove dev packages
RUN npm prune --omit=dev

# Build the runtime container
FROM node:25-alpine as app
# create app directory
RUN mkdir -p /home/node/app/public && chown -R node:node /home/node/app/
WORKDIR /home/node/app
USER node
RUN npm config set update-notifier=false
# copy server node_modules
COPY --from=build --chown=node:node /app/server/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
# copy server
COPY --from=build --chown=node:node /app/server/build ./build
COPY --from=build --chown=node:node /app/server/config ./config
# copy ui
COPY --from=build --chown=node:node /app/ui/metrics/dist ./public
# expose the port from index
EXPOSE 3000
# start the server
CMD ["node", "build/index.js"]
