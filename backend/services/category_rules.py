from __future__ import annotations

from typing import Iterable, Set


def _normalize(value: str | None) -> str:
    if not value:
        return ""
    return str(value).strip().lower().replace(" ", "").replace("_", "")


def _to_iterable(value) -> Iterable[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return value
    return [value]


def get_profile_category_tokens(profile) -> Set[str]:
    """
    Return normalized tokens for a provider profile categories.
    Supports values like:
    - ["belleza", "bienestar"]
    - ["Belleza"]
    """
    tokens: Set[str] = set()
    raw_categories = getattr(profile, "category", []) or []
    for category in _to_iterable(raw_categories):
        normalized = _normalize(category)
        if normalized:
            tokens.add(normalized)
    return tokens


def is_service_category_allowed_for_profile(service_category_name: str | None, profile) -> bool:
    """
    A service category is valid when it matches one of the profile categories.
    We allow common normalized aliases to avoid strict display-name coupling.
    """
    service_token = _normalize(service_category_name)
    profile_tokens = get_profile_category_tokens(profile)

    if not profile_tokens or not service_token:
        return False

    # Common aliases to support historical/category display differences.
    aliases = {
        "belleza": {"belleza", "beauty"},
        "bienestar": {"bienestar", "wellness", "cuidado"},
        "mascotas": {"mascotas", "pet", "pets"},
    }
    expanded_profile_tokens: Set[str] = set(profile_tokens)
    for token in list(profile_tokens):
        for canonical, values in aliases.items():
            if token in values:
                expanded_profile_tokens.add(canonical)
                expanded_profile_tokens.update(values)

    return service_token in expanded_profile_tokens
