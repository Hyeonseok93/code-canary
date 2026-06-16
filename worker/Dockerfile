FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN groupadd -g 10001 appgroup \
    && useradd -u 10001 -G appgroup -d /app -s /usr/sbin/nologin appuser

COPY pyproject.toml .
COPY src ./src
COPY docker-entrypoint.sh ./

RUN pip install --no-cache-dir . \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh \
    && chown -R appuser:appgroup /app

USER 10001:10001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["code-canary-worker"]
