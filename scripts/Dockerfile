FROM node:24-alpine as build
# create app directory and cd to it
WORKDIR /app
# Copy needed files to the app (current) directory
COPY ./server ./server
COPY ./ui/metrics ./ui
COPY ./scripts ./scripts
RUN npm config set update-notifier=false loglevel=error
# install ui dependences and build ui
WORKDIR /app/ui
RUN npm ci
RUN npm run build
# cd to server folder and build the server
WORKDIR /app/server
RUN npm ci
RUN npm run build

FROM node:24-alpine as app
# create app directory
RUN mkdir -p /home/node/app/public && chown -R node:node /home/node/app/
WORKDIR /home/node/app
USER node
RUN npm config set update-notifier=false
# copy server package file
COPY --from=build --chown=node:node /app/server/package.json ./
# copy server node_modules
COPY --from=build --chown=node:node /app/server/node_modules ./node_modules
# copy server
COPY --from=build --chown=node:node /app/server/build ./build
COPY --from=build --chown=node:node /app/server/config ./config
# copy ui
COPY --from=build --chown=node:node /app/ui/dist ./public
# expose the port from index
EXPOSE 3000
# start the server
CMD ["node", "build/index.js"]
