import os
import ssl

from celery import Celery
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

# Upstash Redis uses rediss:// (TLS). Fall back to plain redis:// for local dev.
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/1")

_using_tls = REDIS_URL.startswith("rediss://")

_ssl_opts: dict = (
    {"ssl_cert_reqs": ssl.CERT_NONE}
    if _using_tls
    else {}
)

celery_app = Celery(
    "glof_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_default_queue="notifications",
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    # TLS options — only applied when using Upstash / rediss://
    broker_use_ssl=_ssl_opts if _using_tls else None,
    redis_backend_use_ssl=_ssl_opts if _using_tls else None,
)
