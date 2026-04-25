"""
GLOFWatch SMS Notifications — Twilio SDK
Sends text alerts to mobile users.
"""
import os
from typing import Dict
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from core.logger import get_logger

sms_log = get_logger("glof.sms")

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")

def _get_twilio_client():
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return None
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_sms(to_number: str, message_body: str) -> Dict[str, object]:
    """Send an SMS via Twilio."""
    if not to_number:
        return {"ok": False, "reason": "missing_recipient"}

    client = _get_twilio_client()
    if not client:
        return {"ok": False, "reason": "missing_twilio_credentials"}

    try:
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_FROM_NUMBER,
            to=to_number
        )
        sms_log.info("SMS sent", extra={"to": to_number, "sid": message.sid})
        return {"ok": True, "id": message.sid, "to": to_number}
    except TwilioRestException as ex:
        sms_log.error("Twilio SMS API Error", extra={"response": str(ex), "to": to_number})
        return {"ok": False, "reason": str(ex), "status_code": ex.status}
    except Exception as e:
        sms_log.error("Twilio SMS Unknown Error", extra={"error": str(e)})
        return {"ok": False, "reason": str(e)}

def send_whatsapp(to_number: str, message_body: str) -> Dict[str, object]:
    """Send a WhatsApp message via Twilio."""
    if not to_number:
        return {"ok": False, "reason": "missing_recipient"}

    client = _get_twilio_client()
    if not client:
        return {"ok": False, "reason": "missing_twilio_credentials"}

    # Format the numbers for WhatsApp
    from_wa = f"whatsapp:{TWILIO_FROM_NUMBER}"
    to_wa = f"whatsapp:{to_number}"

    try:
        message = client.messages.create(
            body=message_body,
            from_=from_wa,
            to=to_wa
        )
        sms_log.info("WhatsApp message sent", extra={"to": to_number, "sid": message.sid})
        return {"ok": True, "id": message.sid, "to": to_number}
    except TwilioRestException as ex:
        sms_log.error("Twilio WhatsApp API Error", extra={"response": str(ex), "to": to_number})
        return {"ok": False, "reason": str(ex), "status_code": ex.status}
    except Exception as e:
        sms_log.error("Twilio WhatsApp Unknown Error", extra={"error": str(e)})
        return {"ok": False, "reason": str(e)}
