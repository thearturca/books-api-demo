FROM node:20-alpine as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./

FROM base as production-dependencies
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base as build
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM production-dependencies as production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY ${JWT_ACCESS_PUBLIC_KEY} ./
COPY ${JWT_ACCESS_PRIVATE_KEY} ./
EXPOSE ${PORT}
CMD ["node", "dist/index.js"]

FROM build as migrator
WORKDIR /app
CMD ["pnpm", "run", "migration:up"]
