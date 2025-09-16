##############################
# BUILD STAGE
##############################
FROM jtl-tkgiharbor.hq.bni.co.id/library-ocp-dev/node:20 AS build
WORKDIR /app

# Optional proxy args
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

# Keep dev deps for build; don't set NODE_ENV=production here
ENV http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY} \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_PRODUCTION=false

# Copy manifest first (better caching)
COPY --chown=node:node package.json package-lock.json* ./

# Install all dependencies (dev + prod)
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Prune dev dependencies for smaller runtime
RUN if [ -f package-lock.json ]; then npm prune --omit=dev; fi

##############################
# RUNTIME STAGE
##############################
FROM jtl-tkgiharbor.hq.bni.co.id/library-ocp-dev/node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Copy only what is needed to run
COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/.next ./.next

# Permissions fallback
RUN chown -R node:node /app && \
    find /app -maxdepth 1 -name "package*.json" -exec chmod 644 {} \;

USER node
EXPOSE 3000

# Optional healthcheck (uncomment if needed)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
#   CMD node -e 'fetch(`http://localhost:${process.env.PORT||3000}`).then(r=>{if(r.status>=400)process.exit(1)}).catch(()=>process.exit(1))'

CMD ["npm", "run", "start"]