# API Reference

RouteFlow exposes a local FastAPI backend for AI assistance, utility actions, and workspace persistence.

## Health

- `GET /api/health`
- Returns backend status and version.

## AI

- `POST /api/chat`
- `POST /api/test-api`
- `POST /api/save-config`
- `GET /api/get-config`
- API keys are redacted by config reads and are only persisted when `ALLOW_PERSIST_API_KEYS=true`.

## Workspace

- `GET /api/workspace`
- `POST /api/workspace`

Workspace payload:

```json
{
  "version": 1,
  "maps": [],
  "runs": [],
  "presets": [],
  "updated_at": "ISO datetime"
}
```

The workspace is stored in `api/data/routeflow_workspace.json`, which is ignored by Git.

## Algorithms

- `GET /api/algorithms`
- `GET /api/compare-algorithms`
- `POST /api/generate-code`
- `POST /api/optimize-code`

Frontend planners live in `web/src/app/lib/planning.js` and currently expose A*, D* Lite-style grid planning, RRT*, and ACO through `planPath`.
