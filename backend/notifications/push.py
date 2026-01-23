import logging
from typing import List, Dict, Any

import requests
from django.utils import timezone

from .models import PushDeviceToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _is_expo_token(token: str) -> bool:
    return token.startswith("ExponentPushToken") or token.startswith("ExpoPushToken")


def send_push_notifications(tokens: List[PushDeviceToken], title: str, body: str, data: Dict[str, Any] | None = None) -> bool:
    """Send push notifications to a list of device tokens via Expo"""
    if not tokens:
        return False

    payload = []
    for token_obj in tokens:
        if not _is_expo_token(token_obj.token):
            logger.warning(f"Invalid Expo push token for user {token_obj.user_id}: {token_obj.token}")
            token_obj.is_active = False
            token_obj.save(update_fields=['is_active', 'updated_at'])
            continue
        payload.append({
            "to": token_obj.token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
        })

    if not payload:
        return False

    try:
        response = requests.post(EXPO_PUSH_URL, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        data = result.get("data", [])

        # Handle invalid tokens
        for idx, item in enumerate(data):
            if item.get("status") != "error":
                continue
            details = item.get("details", {})
            if details.get("error") == "DeviceNotRegistered":
                token_obj = tokens[idx]
                token_obj.is_active = False
                token_obj.save(update_fields=['is_active', 'updated_at'])
                logger.info(f"Deactivated push token for user {token_obj.user_id}")

        return True
    except Exception as exc:
        logger.error(f"Failed to send push notifications: {exc}", exc_info=True)
        return False
