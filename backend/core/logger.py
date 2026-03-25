"""
Structured JSON logging for GLOF EWS.
All log events are JSON-formatted for easy ingestion by log aggregators (ELK, Loki, etc.)
"""
import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Attach any extra fields passed via record
        for key in ("lake_id", "user", "alert_type", "risk_score",
                    "event", "remote_addr", "status_code"):
            if hasattr(record, key):
                log_obj[key] = getattr(record, key)

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj, default=str)


def get_logger(name: str) -> logging.Logger:
    """Return a JSON-formatted logger bound to *name*."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


# Module-level convenience loggers
telemetry_log = get_logger("glof.telemetry")
auth_log = get_logger("glof.auth")
alert_log = get_logger("glof.alert")
audit_log = get_logger("glof.audit")
