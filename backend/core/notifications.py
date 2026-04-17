import os
from typing import Dict

import resend as _resend


def send_email(to_email: str, subject: str, text: str, html: str = "") -> Dict[str, object]:
    """
    Send an email using the Resend Python SDK (same method auth.py uses — known to work).
    Returns structured status so delivery failures are visible to callers.
    """
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "GLOFWatch <onboarding@resend.dev>")
    to_email = (to_email or "").strip().lower()

    if not api_key:
        return {"ok": False, "reason": "missing_resend_api_key"}
    if not to_email:
        return {"ok": False, "reason": "missing_recipient"}

    _resend.api_key = api_key

    # Build a rich HTML body if none provided
    if not html:
        html = f"""
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto;
                    background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;
                    border: 1px solid #1e3a5f;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <span style="font-size: 28px;">🏔️</span>
            <div>
              <div style="font-size: 18px; font-weight: 700; color: #7dd3fc;">GLOFWatch</div>
              <div style="font-size: 11px; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">
                Glacial Lake Outburst Flood Early Warning System
              </div>
            </div>
          </div>
          <div style="background: #1e293b; border-left: 4px solid #ef4444; padding: 16px 20px;
                      border-radius: 0 8px 8px 0; margin-bottom: 20px;">
            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px;
                        text-transform: uppercase; letter-spacing: 1px;">{subject}</div>
            <div style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">{text}</div>
          </div>
          <div style="font-size: 11px; color: #475569; border-top: 1px solid #1e293b;
                      padding-top: 16px; margin-top: 16px;">
            This is an automated alert from the GLOF Early Warning System.
            You are receiving this because you opted in to critical alerts.
          </div>
        </div>
        """

    try:
        result = _resend.Emails.send({
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html,
            "text": text,
        })
        if result and result.get("id"):
            return {"ok": True, "id": result["id"], "to": to_email}
        return {"ok": False, "reason": "resend_no_id", "detail": result, "to": to_email}
    except Exception as exc:
        err = str(exc)
        return {"ok": False, "reason": "unexpected_error", "detail": err, "to": to_email}

