FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --home /app --shell /usr/sbin/nologin app

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend/ /app

# collectstatic needs Django settings; use a build-time placeholder secret.
RUN SECRET_KEY=build-only-not-for-runtime DEBUG=False \
    python manage.py collectstatic --noinput \
    && chown -R app:app /app

USER app
EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://127.0.0.1:3007/ || exit 1

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:3007", "--workers", "3"]
