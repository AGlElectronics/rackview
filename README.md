# RackView

A modern rack management system for visualizing and managing server infrastructure. Built with Go backend, React frontend, and PostgreSQL database.

## Features

- **Dynamic Rack Management**: Create and manage multiple racks with configurable sizes (12U, 25U, 42U, 48U, or custom)
- **Device Visualization**: Interactive rack visualization with device details and specifications
- **Network Mapping**: Visualize network topology and device connections
- **REST API**: Full REST API for programmatic access
- **Docker Support**: Easy deployment with Docker Compose

## Architecture

- **Backend**: Go (Gin framework) with PostgreSQL
- **Frontend**: React 18 with Vite
- **Database**: PostgreSQL 15+

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Go 1.21+ and Node.js 18+ for local development

### Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd rackview
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Web UI: http://localhost:8080
- API: http://localhost:8080/api

The database will be automatically initialized with sample data from the original gear.php file.

### Local Development

#### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Set environment variables (create `.env` file):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=rackview
DB_PASSWORD=rackview
DB_NAME=rackview
DB_SSLMODE=disable
PORT=8080
```

4. Start PostgreSQL (using Docker):
```bash
docker run -d --name rackview-postgres -e POSTGRES_USER=rackview -e POSTGRES_PASSWORD=rackview -e POSTGRES_DB=rackview -p 5432:5432 postgres:15-alpine
```

5. Run the server:
```bash
go run cmd/server/main.go
```

#### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173 with hot module replacement.

## API Documentation

### Rack Endpoints

- `GET /api/racks` - List all racks
- `GET /api/racks/:id` - Get rack details with devices
- `POST /api/racks` - Create new rack
  ```json
  {
    "name": "Rack Name",
    "description": "Description",
    "size_u": 25
  }
  ```
- `PUT /api/racks/:id` - Update rack
- `DELETE /api/racks/:id` - Delete rack

### Device Endpoints

- `GET /api/devices` - List all devices (optional query: `?rack_id=1`)
- `GET /api/devices/:id` - Get device details
- `POST /api/devices` - Create device
  ```json
  {
    "rack_id": 1,
    "name": "Server Name",
    "icon": "🖥️",
    "type": "server",
    "position_u": 21,
    "size_u": 2,
    "status": "online",
    "model": "Model Name",
    "specs": {
      "CPU": "2x Xeon",
      "Memory": "64GB"
    }
  }
  ```
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Network Endpoints

- `GET /api/network/connections` - List all network connections
- `POST /api/network/connections` - Create connection
  ```json
  {
    "source_device_id": 1,
    "target_device_id": 2,
    "connection_type": "Ethernet",
    "port_info": "Port 1"
  }
  ```
- `DELETE /api/network/connections/:id` - Delete connection

## Project Structure

```
rackview/
├── backend/              # Go backend
│   ├── cmd/server/      # Application entry point
│   ├── internal/        # Internal packages
│   │   ├── api/        # API routes
│   │   ├── database/    # Database connection & migrations
│   │   ├── handlers/    # HTTP handlers
│   │   ├── models/      # Data models
│   │   └── services/    # Business logic
│   ├── migrations/      # SQL migrations
│   └── Dockerfile       # Backend Dockerfile
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API client
│   └── package.json
└── docker-compose.yml   # Docker Compose configuration
```

## Database Schema

- **racks**: Rack information (id, name, description, size_u)
- **devices**: Device information (id, rack_id, name, icon, type, position_u, size_u, status, model)
- **device_specs**: Flexible device specifications (key-value pairs)
- **network_connections**: Network topology connections

## Environment Variables

### Backend

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user (default: rackview)
- `DB_PASSWORD` - Database password (default: rackview)
- `DB_NAME` - Database name (default: rackview)
- `DB_SSLMODE` - SSL mode (default: disable)
- `PORT` - Server port (default: 8080)
- `STATIC_PATH` - Path to React build (default: ../frontend/dist)
- `INDEX_PATH` - Path to index.html (default: ../frontend/dist/index.html)

## Building

### Build Backend

```bash
cd backend
go build -o server ./cmd/server
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Build Docker Image

```bash
docker-compose build
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running and accessible
- Check environment variables match your database configuration
- Verify network connectivity between containers (if using Docker)

### Frontend Not Loading

- Ensure React build exists in `frontend/dist`
- Check that `STATIC_PATH` and `INDEX_PATH` environment variables are correct
- Verify the backend is serving static files correctly

### Migration Issues

- Migrations run automatically on server startup
- Check database logs for migration errors
- Ensure database user has CREATE TABLE permissions

## License

[Add your license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
