# Email Cadence Monorepo

A **TypeScript monorepo** for building an email cadence system using:

- **Next.js** → Frontend (`apps/web`)
- **NestJS** → API backend (`apps/api`)
- **Temporal.io** → Worker for email workflows (`apps/worker`)

All projects are managed with **pnpm workspaces**.

---

## 🏗 Monorepo Structure

```
email-cadence/
├── apps/
│   ├── web/       # Next.js frontend
│   ├── api/       # NestJS backend
│   └── worker/    # Temporal worker
├── package.json
├── tsconfig.base.json
└── README.md
```

---

## ⚡ Prerequisites

- Node.js v20+
- pnpm v8+
- Temporal CLI & server for local dev

Install pnpm:

```bash
npm install -g pnpm
```

---

## 🛠 Setup

1. Clone the repo:

```bash
git clone <repo-url>
cd email-cadence
```

2. Install dependencies:

```bash
pnpm install
```

3. Start Temporal server (for local development):

```bash
temporal server start-dev
```

---

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Temporal.io Configuration
# Replace these placeholders with your actual Temporal.io settings

TEMPORAL_ADDRESS=<TEMPORAL_IO_SERVER_ADDRESS>
TEMPORAL_NAMESPACE=<NAMESPACE>

# API Configuration (optional, defaults shown)
API_PORT=3001

# Web Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Configuration Placeholders

| Variable | Description | Example |
|----------|-------------|---------|
| `TEMPORAL_ADDRESS` | Temporal.io server address | `localhost:7233` or `your-namespace.tm.prd.sh` |
| `TEMPORAL_NAMESPACE` | Temporal namespace | `default` or `email-cadence-namespace` |
| `TEMPORAL_TASK_QUEUE` | Task queue name | `cadence-queue` |

---

## 🏃 Running Each App

### Option 1: Run All Apps Concurrently

From the root directory:

```bash
pnpm dev
```

This runs all three apps concurrently:
- Web: http://localhost:3000
- API: http://localhost:3001
- Worker: Connects to Temporal on `cadence-queue`

---

### Option 2: Run Apps Individually

#### 1. Next.js Frontend

```bash
cd apps/web
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

#### 2. NestJS API

```bash
cd apps/api
pnpm run start:dev
```

API runs on `http://localhost:3001` (or `PORT` environment variable).

**Environment Variables:**
```bash
PORT=3001
# Temporal.io (uses default connection if not specified)
TEMPORAL_ADDRESS=<TEMPORAL_IO_SERVER_ADDRESS>
TEMPORAL_NAMESPACE=<NAMESPACE>
```

---

#### 3. Temporal Worker

```bash
cd apps/worker
pnpm run dev
```

Worker listens on task queue `cadence-queue`.

**Environment Variables:**
```bash
# Temporal.io (uses default connection if not specified)
TEMPORAL_ADDRESS=<TEMPORAL_IO_SERVER_ADDRESS>
TEMPORAL_NAMESPACE=<NAMESPACE>
TEMPORAL_TASK_QUEUE=cadence-queue
```

---

## 📋 Monorepo Scripts

Run scripts from **root** using pnpm:

```bash
# Run all apps concurrently
pnpm dev

# Run individual apps
pnpm dev:web     # Next.js frontend
pnpm dev:api     # NestJS API
pnpm dev:worker  # Temporal worker

# Build all apps
pnpm build

# Start apps in production mode
pnpm start:web
pnpm start:api
pnpm start:worker
```

---

## 🔌 Temporal.io Integration

### Default Configuration

The application uses Temporal.io's default connection. To customize, set these environment variables:

```bash
TEMPORAL_ADDRESS=localhost:7233    # Temporal server address
TEMPORAL_NAMESPACE=default         # Your namespace
```

### Task Queue

The worker uses task queue: `cadence-queue`

To use a different task queue, update the worker configuration:

```typescript
// apps/worker/src/worker.ts
const worker = await Worker.create({
  taskQueue: 'your-custom-queue',  // Change this
  // ... other config
});
```

### Connecting from API

The API uses the default Temporal client connection:

```typescript
// apps/api/src/worker/worker-client.ts
const client = new WorkflowClient();  // Uses default connection
```

To specify a custom Temporal server, set `TEMPORAL_ADDRESS` environment variable before creating the client.

---

## 📝 Notes

- The API connects to Temporal using the default client connection
- The worker uses task queue `cadence-queue` for processing email cadence workflows
- The web frontend expects the API at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`)
- All three apps must be running for the full email cadence system to work

---

## 📡 Example API Calls

Once the API is running, you can test the following endpoints:

### Base URL
```
http://localhost:3001
```

### Cadences API

**Create a Cadence:**
```bash
curl -X POST http://localhost:3001/cadences \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cadence_001",
    "name": "Welcome Series",
    "steps": [
      { "id": "step1", "type": "WAIT", "seconds": 86400 },
      { "id": "step2", "type": "SEND_EMAIL", "subject": "Welcome!", "body": "Hello there!" }
    ]
  }'
```

**List all Cadences:**
```bash
curl http://localhost:3001/cadences
```

**Get a Cadence by ID:**
```bash
curl http://localhost:3001/cadences/cadence_001
```

**Update a Cadence:**
```bash
curl -X PUT http://localhost:3001/cadences/cadence_001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Welcome Series",
    "steps": [
      { "id": "step1", "type": "WAIT", "seconds": 43200 },
      { "id": "step2", "type": "SEND_EMAIL", "subject": "Welcome!", "body": "Hello and welcome!" }
    ]
  }'
```

**Delete a Cadence:**
```bash
curl -X DELETE http://localhost:3001/cadences/cadence_001
```

---

### Enrollments API

**Create an Enrollment (start a workflow):**
```bash
curl -X POST http://localhost:3001/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "cadenceId": "cadence_001",
    "contactEmail": "user@example.com"
  }'
```

**List all Enrollments:**
```bash
curl http://localhost:3001/enrollments
```

**Get an Enrollment by Workflow ID:**
```bash
curl http://localhost:3001/enrollments/<workflow-id>
```

**Update an Enrollment's Cadence:**
```bash
curl -X POST http://localhost:3001/enrollments/<workflow-id>/update-cadence \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      { "id": "step1", "type": "WAIT", "seconds": 3600 },
      { "id": "step2", "type": "SEND_EMAIL", "subject": "New Email", "body": "Updated content" }
    ]
  }'
```

---

### Example: Complete Workflow

1. **Create a cadence:**
```bash
curl -X POST http://localhost:3001/cadences \
  -H "Content-Type: application/json" \
  -d '{"id": "onboarding", "name": "Onboarding", "steps": []}'
```

2. **Enroll a contact:**
```bash
curl -X POST http://localhost:3001/enrollments \
  -H "Content-Type: application/json" \
  -d '{"cadenceId": "onboarding", "contactEmail": "john@example.com"}'
```

3. **Check the enrollment status:**
```bash
curl http://localhost:3001/enrollments
```

