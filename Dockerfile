# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

COPY backend/go.mod backend/go.sum* ./
RUN go mod download || true

COPY backend/internal/ ./internal/
COPY backend/cmd/ ./cmd/
COPY backend/go.mod backend/go.sum ./
COPY backend/migrations/ ./internal/database/migrations/

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags='-w -s' \
    -o server \
    ./cmd/server

# Stage 3: Runtime
FROM alpine:latest

LABEL org.opencontainers.image.source="https://github.com/AGlElectronics/rackview"
LABEL org.opencontainers.image.description="RackView - rack management and visualization"

RUN apk --no-cache add ca-certificates tzdata wget

RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

COPY --from=backend-builder /app/server ./server
COPY --from=frontend-builder /app/dist ./frontend/dist

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENV PORT=8080
ENV STATIC_PATH=/app/frontend/dist
ENV INDEX_PATH=/app/frontend/dist/index.html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/racks || exit 1

CMD ["./server"]
