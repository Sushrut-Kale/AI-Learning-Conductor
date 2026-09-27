# Security Reference — AI Learning Conductor

**Version**: 1.0

---

## Security Architecture

### API Key Security

- `GEMINI_API_KEY` is **only** held in the backend environment
- The frontend **never** sees or handles any AI credentials
- Architecture: `Frontend → FastAPI Backend → Gemini API`
- Keys must be set as environment variables, **never in source code**

### CORS Policy

- **Development**: `http://localhost:3000`, `http://localhost:5173`
- **Production**: Exact frontend domain only (set via `CORS_ORIGINS` env var)
- `allow_origins=["*"]` is **prohibited** in production

### Error Responses

Production error responses never expose:
- Stack traces
- Internal exception messages
- File paths
- Database query details

All unhandled errors return:
```json
{"error": "Unable to process request", "request_id": "abc12345"}
```

Detailed errors go to server logs only, keyed by `request_id`.

### Data Privacy

- Student data never sent to Gemini by name in Phase 5 (anonymised IDs only)
- Gemini receives structured summaries, not raw voice recordings
- No student data is transmitted to third parties beyond the AI service

### Audit Trail

Every evidence-changing action is logged:
- `assessment_submitted`
- `fingerprint_teacher_override`
- `diagnostic_hypothesis_override`

Audit log is accessible at `GET /api/audit-log` (production: restrict to authorised roles).

---

## Known Limitations (Prototype)

| Area | Current Status | Production Requirement |
|---|---|---|
| Authentication | None (single teacher) | Teacher login with session management |
| Authorisation | No role-based access | Teacher ↔ Coordinator ↔ Admin roles |
| Rate limiting | Not implemented | Rate limit all public endpoints |
| HTTPS | Not enforced at app level | Enforce via platform/proxy |
| Data encryption | IndexedDB not encrypted | Encrypt at rest for production |
| Backup | Not automated | Scheduled DB backups required |

---

## Before Production Deployment

- [ ] Set `ENVIRONMENT=production` (disables Swagger UI)
- [ ] Set `CORS_ORIGINS` to exact frontend domain
- [ ] Rotate any API keys if they were ever in source code
- [ ] Audit `.gitignore` to confirm no secrets committed
- [ ] Run `git log --all --full-history -- "**/.env"` to check for past secret commits
- [ ] Enable HTTPS on your hosting platform
- [ ] Set up database backups
- [ ] Implement authentication before student data is real
