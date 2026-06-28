FROM node:26-alpine AS build
# Node 25's alpine image dropped corepack from the base layer but still
# ships /usr/local/bin/yarn, which makes `npm install -g corepack` fail
# with EEXIST. Install pnpm directly at the packageManager version in
# package.json instead of going through corepack's shim dance.
RUN npm install -g pnpm@9.15.4
WORKDIR /app
ARG NODE_AUTH_TOKEN=
COPY .npmrc package.json pnpm-lock.yaml ./
RUN --mount=type=secret,id=github_token \
    NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-$(cat /run/secrets/github_token 2>/dev/null || true)}" \
    && printf '%s\n' \
        '@jorisjonkers-dev:registry=https://npm.pkg.github.com' \
        "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" \
        > ~/.npmrc \
    && pnpm install --frozen-lockfile
COPY . .
ARG VITE_FARO_URL=https://faro.jorisjonkers.dev/collect
RUN VITE_FARO_URL=${VITE_FARO_URL} pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
