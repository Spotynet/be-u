import math
from typing import Iterable, List, Optional, Tuple


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance in kilometers between two coordinates using Haversine formula.
    """
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def _get_coords(item) -> Tuple[Optional[float], Optional[float]]:
    latitude = getattr(item, "latitude", None)
    longitude = getattr(item, "longitude", None)
    if latitude is None or longitude is None:
        return None, None
    try:
        return float(latitude), float(longitude)
    except (TypeError, ValueError):
        return None, None


def annotate_distance(items: Iterable, latitude: float, longitude: float) -> List:
    """
    Attach distance_km attribute to each item.
    """
    annotated = []
    for item in items:
        item_lat, item_lng = _get_coords(item)
        if item_lat is None or item_lng is None:
            setattr(item, "distance_km", None)
        else:
            setattr(item, "distance_km", calculate_distance(latitude, longitude, item_lat, item_lng))
        annotated.append(item)
    return annotated


def filter_by_radius(items: Iterable, latitude: float, longitude: float, radius_km: float) -> List:
    """
    Return items within radius_km. Items without coordinates are excluded.
    """
    filtered = []
    for item in items:
        item_lat, item_lng = _get_coords(item)
        if item_lat is None or item_lng is None:
            continue
        distance = calculate_distance(latitude, longitude, item_lat, item_lng)
        if distance <= radius_km:
            setattr(item, "distance_km", distance)
            filtered.append(item)
    return filtered
