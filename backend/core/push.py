import os
import json
from pywebpush import webpush, WebPushException
from core.logger import get_logger

push_log = get_logger("glof.push")

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "SOO6-dt4TLYfZIVXjdjHWi7EwgPtL42dwd63lkX-_Jw")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "BBNOZOeBo9BwRnnr2O4DJHeT2hikkxejeF65wlVyNUvMGMzkoWBxYFb3sxRJnP2gRGjwZG_sMTZoicNnpGVEvag")
VAPID_CLAIMS = {
    "sub": "mailto:admin@glofwatch.com"
}

def send_web_push(subscription_info: dict, message_data: dict) -> dict:
    """Send a push notification via pywebpush."""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(message_data),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        return {"ok": True}
    except WebPushException as ex:
        push_log.error("WebPush API Error", extra={
            "response": ex.response.text if ex.response else "No response",
            "endpoint": subscription_info.get("endpoint")
        })
        # If response is Gone (410), we should ideally remove it from DB
        return {"ok": False, "reason": str(ex), "status_code": ex.response.status_code if ex.response else None}
    except Exception as e:
        push_log.error("WebPush Unknown Error", extra={"error": str(e)})
        return {"ok": False, "reason": str(e)}
