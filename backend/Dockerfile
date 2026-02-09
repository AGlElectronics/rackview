# Build stage for React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install

# Copy source code
COPY frontend/ ./

# Build React app
RUN npm run build

# Build stage for Go backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum* ./
RUN go mod download

# Copy source code (excluding migrations from backend copy)
COPY backend/internal/ ./internal/
COPY backend/cmd/ ./cmd/
COPY backend/go.mod backend/go.sum ./

# Copy migrations to a location that can be embedded
COPY backend/migrations/ ./internal/database/migrations/

# Tidy and build the application
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/server .

# Copy frontend build
COPY --from=frontend-builder /app/dist ./frontend/dist

# Copy migrations
COPY --from=backend-builder /app/internal/database/migrations ./migrations

EXPOSE 8080

ENV PORT=8080
ENV STATIC_PATH=/app/frontend/dist
ENV INDEX_PATH=/app/frontend/dist/index.html

CMD ["./server"]
