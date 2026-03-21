# fastify-crud-api

Product CRUD API built with Fastify.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start in development mode:

```bash
npm run start:dev
```

3. API base URL:

```text
http://localhost:4000
```

4. Swagger UI:

```text
http://localhost:4000/api/docs
```

## Horizontal scaling with load balancer

This repository includes a Docker Compose topology with:

- 3 API instances (`api-1`, `api-2`, `api-3`)
- 1 NGINX load balancer (`load-balancer`)

### Start scaled stack

```bash
docker compose up --build
```

The load balancer is exposed at:

```text
http://localhost:8080
```

### Verify load-balanced instances

Call the health endpoint multiple times:

```bash
curl http://localhost:8080/health
```

Response includes `instanceId` and `pid`, so you can see requests being served by different instances.

### Important note about data consistency

The current `ProductDb` is in-memory per process. With multiple instances, product data is not shared across replicas.

For production-grade horizontal scaling, replace `ProductDb` with a shared datastore (for example PostgreSQL, MySQL, Redis, or MongoDB).

## Tests

```bash
npm test
```
