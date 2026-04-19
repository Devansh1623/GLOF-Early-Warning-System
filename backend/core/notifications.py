"""
GLOFWatch Email Notifications — Resend SDK
Sends rich HTML alert emails for Warning (score ≥ 61) and Emergency (score ≥ 80) events.
"""
import os
from typing import Dict

import resend as _resend


# ── Colour palette per risk level ────────────────────────────────────────────
_LEVEL_PALETTE = {
    "Critical":  {"border": "#ef4444", "badge_bg": "#450a0a", "badge_fg": "#fca5a5", "icon": "🔴"},
    "High":      {"border": "#f97316", "badge_bg": "#431407", "badge_fg": "#fdba74", "icon": "🟠"},
    "Moderate":  {"border": "#eab308", "badge_bg": "#422006", "badge_fg": "#fde047", "icon": "🟡"},
    "Low":       {"border": "#22c55e", "badge_bg": "#052e16", "badge_fg": "#86efac", "icon": "🟢"},
}

_DEFAULT_PALETTE = {"border": "#64748b", "badge_bg": "#1e293b", "badge_fg": "#94a3b8", "icon": "⚪"}


def _build_alert_html(
    lake_name: str,
    risk_level: str,
    risk_score: float,
    alert_type: str,
    alert_message: str,
    breakdown: dict,
    timestamp: str,
    lake_state: str = "",
    lake_elevation: str = "",
) -> str:
    """Build a rich branded HTML email for a GLOF alert."""
    pal = _LEVEL_PALETTE.get(risk_level, _DEFAULT_PALETTE)
    score_pct = min(int(risk_score), 100)

    # Breakdown bars
    t_contrib  = breakdown.get("temperature_contribution", 0)
    r_contrib  = breakdown.get("rainfall_contribution", 0)
    wl_contrib = breakdown.get("water_level_contribution", 0)

    def bar(label: str, value: float, color: str) -> str:
        pct = min(int(value), 35)   # each factor max ≈ 35 pts
        pct_display = min(int(value / 35 * 100), 100)
        return f"""
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">{label}</span>
            <span style="font-size:11px;color:{color};font-weight:700;">{value:.1f} pts</span>
          </div>
          <div style="background:#1e293b;border-radius:99px;height:6px;overflow:hidden;">
            <div style="background:{color};width:{pct_display}%;height:100%;border-radius:99px;transition:width 0.3s;"></div>
          </div>
        </div>"""

    detail_rows = ""
    if lake_state:
        detail_rows += f'<tr><td style="color:#64748b;padding:4px 0;font-size:12px;">State</td><td style="color:#e2e8f0;padding:4px 0;font-size:12px;text-align:right;">{lake_state}</td></tr>'
    if lake_elevation:
        detail_rows += f'<tr><td style="color:#64748b;padding:4px 0;font-size:12px;">Elevation</td><td style="color:#e2e8f0;padding:4px 0;font-size:12px;text-align:right;">{lake_elevation} m</td></tr>'

    warning_banner = ""
    if risk_level in ("Critical",):
        warning_banner = f"""
        <div style="background:#450a0a;border:1px solid #ef4444;border-radius:8px;padding:14px 18px;margin-bottom:20px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#fca5a5;letter-spacing:1px;">
            ⚠️ IMMEDIATE ACTION REQUIRED — EVACUATION PROTOCOLS MAY BE NECESSARY
          </div>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>GLOFWatch Alert — {lake_name}</title></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Courier New',Courier,monospace;">
  <div style="max-width:600px;margin:32px auto;background:#0f172a;border-radius:16px;
              border:1px solid {pal['border']}40;overflow:hidden;box-shadow:0 0 40px {pal['border']}20;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
                border-bottom:1px solid {pal['border']}40;padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <span style="font-size:32px;">🏔️</span>
        <div>
          <div style="font-size:20px;font-weight:700;color:#7dd3fc;letter-spacing:-0.5px;">GLOFWatch</div>
          <div style="font-size:10px;color:#475569;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">
            Glacial Lake Outburst Flood · Early Warning System
          </div>
        </div>
        <div style="margin-left:auto;background:{pal['badge_bg']};border:1px solid {pal['border']};
                    border-radius:99px;padding:6px 14px;">
          <span style="color:{pal['badge_fg']};font-size:12px;font-weight:700;letter-spacing:1px;">
            {pal['icon']} {risk_level.upper()}
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      {warning_banner}

      <!-- Alert type + lake name -->
      <div style="margin-bottom:20px;">
        <div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">
          {alert_type} Alert
        </div>
        <div style="font-size:22px;font-weight:700;color:#e2e8f0;letter-spacing:-0.5px;">{lake_name}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">{timestamp}</div>
      </div>

      <!-- Risk score gauge -->
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;">
          <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Risk Score</span>
          <span style="font-size:32px;font-weight:700;color:{pal['border']};letter-spacing:-2px;">{risk_score:.1f}</span>
        </div>
        <div style="background:#0f172a;border-radius:99px;height:8px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#22c55e,#eab308,{pal['border']});
                      width:{score_pct}%;height:100%;border-radius:99px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="font-size:10px;color:#374151;">0 — Low</span>
          <span style="font-size:10px;color:#374151;">100 — Critical</span>
        </div>
      </div>

      <!-- Alert message -->
      <div style="background:#1e293b;border-left:4px solid {pal['border']};border-radius:0 8px 8px 0;
                  padding:14px 18px;margin-bottom:20px;">
        <div style="font-size:13px;color:#e2e8f0;line-height:1.6;">{alert_message}</div>
      </div>

      <!-- Breakdown -->
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">
          Risk Factor Breakdown
        </div>
        {bar("Temperature", t_contrib, "#7dd3fc")}
        {bar("Rainfall", r_contrib, "#a5b4fc")}
        {bar("Water Level", wl_contrib, "{pal['border']}")}
      </div>

      <!-- Lake details -->
      {'<div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin-bottom:20px;"><table style="width:100%;border-collapse:collapse;">' + detail_rows + '</table></div>' if detail_rows else ''}

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:20px;">
        <a href="https://glof-frontend.onrender.com/dashboard"
           style="display:inline-block;background:{pal['border']};color:#fff;font-weight:700;
                  font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;
                  letter-spacing:0.5px;">
          View Live Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0a0f1a;border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
      <div style="font-size:10px;color:#374151;line-height:1.7;">
        You are receiving this because you opted in to GLOFWatch alerts.<br>
        This is an automated message from the GLOF Early Warning System.<br>
        Data sources: CWC · NRSC · NDMA · Open-Meteo
      </div>
    </div>
  </div>
</body>
</html>"""


def send_alert_email(
    to_email: str,
    lake_name: str,
    risk_level: str,
    risk_score: float,
    alert_type: str,
    alert_message: str,
    breakdown: dict,
    timestamp: str,
    lake_state: str = "",
    lake_elevation: str = "",
) -> Dict[str, object]:
    """
    Send a rich GLOF alert email for a specific risk event.
    Returns structured result dict: {ok, id, to} or {ok, reason, detail, to}.
    """
    api_key    = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "GLOFWatch <onboarding@resend.dev>")
    to_email   = (to_email or "").strip().lower()

    if not api_key:
        return {"ok": False, "reason": "missing_resend_api_key"}
    if not to_email:
        return {"ok": False, "reason": "missing_recipient"}

    _resend.api_key = api_key

    subject = f"[GLOFWatch {alert_type}] {lake_name} — Risk Score {risk_score:.1f}"
    html    = _build_alert_html(
        lake_name, risk_level, risk_score, alert_type, alert_message,
        breakdown, timestamp, lake_state, lake_elevation,
    )
    text = (
        f"GLOFWatch {alert_type} — {lake_name}\n"
        f"Risk Level: {risk_level} | Score: {risk_score:.1f}/100\n\n"
        f"{alert_message}\n\n"
        f"Breakdown:\n"
        f"  Temperature:  {breakdown.get('temperature_contribution', 0):.1f} pts\n"
        f"  Rainfall:     {breakdown.get('rainfall_contribution', 0):.1f} pts\n"
        f"  Water Level:  {breakdown.get('water_level_contribution', 0):.1f} pts\n\n"
        f"Timestamp: {timestamp}\n"
        f"Dashboard: https://glof-frontend.onrender.com/dashboard\n\n"
        f"This is an automated alert from the GLOF Early Warning System."
    )

    try:
        result = _resend.Emails.send({
            "from":    from_email,
            "to":      [to_email],
            "subject": subject,
            "html":    html,
            "text":    text,
        })
        if result and result.get("id"):
            return {"ok": True, "id": result["id"], "to": to_email}
        return {"ok": False, "reason": "resend_no_id", "detail": result, "to": to_email}
    except Exception as exc:
        return {"ok": False, "reason": "unexpected_error", "detail": str(exc), "to": to_email}


def send_email(to_email: str, subject: str, text: str, html: str = "") -> Dict[str, object]:
    """
    Generic email send — used by the Celery task for admin broadcasts.
    """
    api_key    = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "GLOFWatch <onboarding@resend.dev>")
    to_email   = (to_email or "").strip().lower()

    if not api_key:
        return {"ok": False, "reason": "missing_resend_api_key"}
    if not to_email:
        return {"ok": False, "reason": "missing_recipient"}

    _resend.api_key = api_key

    if not html:
        html = f"""
        <div style="font-family:'Courier New',monospace;max-width:600px;margin:0 auto;
                    background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;
                    border:1px solid #1e3a5f;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <span style="font-size:28px;">🏔️</span>
            <div>
              <div style="font-size:18px;font-weight:700;color:#7dd3fc;">GLOFWatch</div>
              <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">
                Glacial Lake Outburst Flood Early Warning System
              </div>
            </div>
          </div>
          <div style="background:#1e293b;border-left:4px solid #ef4444;padding:16px 20px;
                      border-radius:0 8px 8px 0;margin-bottom:20px;">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:6px;
                        text-transform:uppercase;letter-spacing:1px;">{subject}</div>
            <div style="font-size:15px;color:#e2e8f0;line-height:1.6;">{text}</div>
          </div>
          <div style="font-size:11px;color:#475569;border-top:1px solid #1e293b;
                      padding-top:16px;margin-top:16px;">
            This is an automated message from the GLOF Early Warning System.
            You are receiving this because you opted in to critical alerts.
          </div>
        </div>"""

    try:
        result = _resend.Emails.send({
            "from":    from_email,
            "to":      [to_email],
            "subject": subject,
            "html":    html,
            "text":    text,
        })
        if result and result.get("id"):
            return {"ok": True, "id": result["id"], "to": to_email}
        return {"ok": False, "reason": "resend_no_id", "detail": result, "to": to_email}
    except Exception as exc:
        return {"ok": False, "reason": "unexpected_error", "detail": str(exc), "to": to_email}
