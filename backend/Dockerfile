FROM python:3.12-slim

LABEL org.opencontainers.image.title="AI Learning Conductor — Backend"
LABEL org.opencontainers.image.description="Evidence-grounded foundational learning intelligence platform"
LABEL org.opencontainers.image.version="1.0.0"

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Install dependencies first (Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for SQLite (dev) or persistent volume mount (prod)
RUN mkdir -p /app/data && chown appuser:appgroup /app/data

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

# Run with uvicorn
# In production, override ENVIRONMENT and DEMO_MODE via environment variables
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
