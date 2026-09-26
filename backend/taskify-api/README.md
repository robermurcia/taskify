# Deploy the API on Render

Create a Docker Web Service with these settings:

- Root Directory: `backend/taskify-api`
- Dockerfile Path: `./Dockerfile`
- Docker Build Context: `.`
- Docker Command: leave empty to use the image entrypoint.
- Environment variables: set `MONGO_URI` and `SECRET_KEY` in Render, never in Git or the Dockerfile.

Spring listens on `0.0.0.0` and uses Render's `PORT`, falling back to `8080` locally. `EXPOSE 8080` documents the local default; it does not override `PORT`.

The build stage uses Maven and Java 17 and runs the tests before packaging. The runtime stage contains the Java 17 JRE and the executable JAR, running as a non-root user. `.env` files and local build output are excluded from the Docker context; no environment file is needed to build the image.

From this directory:

```sh
docker build -t taskify-api .
docker run --rm -p 8080:8080 --env-file .env taskify-api
```

To check a different port:

```sh
docker run --rm -p 10000:10000 --env-file .env -e PORT=10000 taskify-api
```

MongoDB must allow connections from the deployment environment. Existing API security remains unchanged: protected endpoints return 401 without authentication. Do not configure a protected route as an HTTP health check.

`SECRET_KEY` must be standard Base64 encoding of at least 32 random bytes. Generate it privately, for example with `openssl rand -base64 32`, and save the output only in Render's environment settings (or your ignored local `.env`). Startup fails with a clear error if the value is missing, malformed, or too short. Keep the same value across restarts and instances. The switch from the previous random signing key invalidates existing access tokens; subsequent restarts preserve valid tokens. Update an incompatible existing Render value before deploying this version.

Set `CORS_ALLOWED_ORIGINS` in Render to your exact frontend origin, such as `https://your-project.vercel.app`, without a trailing slash. Multiple trusted origins can be comma-separated; the default is `http://localhost:4200`. This allows requests whose Origin header is forwarded by the Vercel proxy. Add custom domains explicitly instead of allowing every preview domain.

References: [Render Docker services](https://render.com/docs/docker), [port binding](https://render.com/docs/web-services#port-binding).

## Demo startup and API compatibility

- `GET /api/health` is public and returns only `{"status":"UP"}` with `Cache-Control: no-store`. It checks HTTP liveness, not MongoDB readiness, and exposes no infrastructure details. It can be used as the Render HTTP health check. Deploy this endpoint before the frontend startup screen.
- `GET /api/tasks` and `GET /api/tasks/today` keep their existing query parameters, task content and top-level pagination fields (`content`, `number`, `size`, `totalElements`, `totalPages`, `first`, `last`, `empty`, `numberOfElements`, `sort`, `pageable`). An explicit response DTO replaces direct `PageImpl` serialization; metadata is not moved under a new `page` field.
- Spring Security creates the authentication provider from the existing `UserDetailsService` and BCrypt password encoder. Login, JWT validation and refresh contracts are unchanged.
- Swagger UI and OpenAPI are disabled by default, including access to their public routes. Set `API_DOCS_ENABLED=true` only where you intentionally want public API documentation. No change is required to `SECRET_KEY` or `MONGO_URI` for this feature.

Regression checks cover cold startup, bounded waiting/manual retry, authentication, pagination and creating/listing/reloading tasks. The local packaged-JAR smoke check also created, queried and removed a temporary task using the configured MongoDB connection. This is not a verification of a deployed Vercel/Render release.
