


FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prod

RUN apt-get update -qq && \
apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

WORKDIR /app

COPY pnpm-lock.yaml /app
COPY package.json /app

RUN pnpm install

COPY . /app
RUN pnpm run build

RUN rm -rf /node-modules
RUN pnpm install --prod

FROM base
COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/build /app/build
COPY --from=prod /app/public /app/build/public
EXPOSE 3333
CMD [ "node", "/app/build/server.js" ]