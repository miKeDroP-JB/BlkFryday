# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║   ORBOS Docker Image                                                       ║
# ║   Local-first consciousness engine                                         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /app/data/glyphs /app/data/context /app/data/cache

# Initialize empty ledgers
RUN echo '{"balances":{},"transactions":[]}' > /app/data/ekoLedger.json 2>/dev/null || true
RUN echo '{"gifts":[],"karma":{}}' > /app/data/giftLog.json 2>/dev/null || true

# Environment
ENV NODE_ENV=production
ENV ORB_MODE=local-first
ENV PORT=3000
ENV WS_PORT=8081

# Expose ports
EXPOSE 3000 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start ORB in server mode
CMD ["node", "term.js", "--server"]
