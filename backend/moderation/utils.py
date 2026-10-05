from django.db.models import Q

from .models import UserBlock


def blocked_user_ids(user):
    """User ids hidden from this viewer, in either block direction."""
    if not getattr(user, "is_authenticated", False):
        return []
    pairs = UserBlock.objects.filter(Q(blocker=user) | Q(blocked=user)).values_list(
        "blocker_id", "blocked_id"
    )
    hidden = set()
    for blocker_id, blocked_id in pairs:
        hidden.add(blocked_id if blocker_id == user.id else blocker_id)
    hidden.discard(user.id)
    return list(hidden)
