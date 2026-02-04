"""
Google Maps API proxy endpoints to avoid CORS issues
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

def _get_google_maps_api_key():
    """Get Google Maps API key from environment variables"""
    # First, try to get from environment (should be loaded by settings.py)
    api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
    
    # If not found, try to load .env file directly
    if not api_key:
        # settings.BASE_DIR points to backend/ (where manage.py is), so .env should be at BASE_DIR / '.env'
        env_path = settings.BASE_DIR / '.env'
        if env_path.exists():
            # Load the .env file explicitly
            load_dotenv(dotenv_path=env_path, override=True)
            api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
    
    # Fallback: try to get from Django settings if it's defined there
    if not api_key:
        api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
    
    # Debug logging (remove in production if needed)
    if not api_key:
        import logging
        logger = logging.getLogger(__name__)
        env_path = settings.BASE_DIR / '.env'
        logger.warning(
            f'GOOGLE_MAPS_API_KEY not found. '
            f'env_path: {env_path}, exists: {env_path.exists()}, '
            f'os.environ keys: {[k for k in os.environ.keys() if "GOOGLE" in k]}'
        )
    
    return api_key

@api_view(['GET'])
@permission_classes([AllowAny])
def google_places_autocomplete(request):
    """
    Proxy endpoint for Google Places Autocomplete API
    GET /api/google-maps/places/autocomplete/?input=address
    """
    api_key = _get_google_maps_api_key()
    if not api_key:
        return Response(
            {'error': 'Google Maps API key not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    query = request.query_params.get('input', '')
    if not query or len(query) < 3:
        return Response({'predictions': []})
    
    try:
        url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        params = {
            'input': query,
            'key': api_key,
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Return only the predictions array
        predictions = data.get('predictions', [])
        formatted_predictions = [
            {
                'place_id': p.get('place_id'),
                'description': p.get('description'),
            }
            for p in predictions
        ]
        
        return Response({
            'predictions': formatted_predictions,
            'status': data.get('status', 'OK')
        })
    except requests.RequestException as e:
        return Response(
            {'error': f'Failed to fetch autocomplete: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def google_place_details(request):
    """
    Proxy endpoint for Google Places Details API
    GET /api/google-maps/places/details/?place_id=xxx
    """
    api_key = _get_google_maps_api_key()
    if not api_key:
        return Response(
            {'error': 'Google Maps API key not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    place_id = request.query_params.get('place_id', '')
    if not place_id:
        return Response(
            {'error': 'place_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        url = 'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': place_id,
            'fields': 'geometry,formatted_address,address_components',
            'key': api_key,
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') != 'OK':
            return Response(
                {'error': f"Places API error: {data.get('status')}", 'message': data.get('error_message')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = data.get('result', {})
        geometry = result.get('geometry', {})
        location = geometry.get('location', {})
        
        if not location:
            return Response(
                {'error': 'No location found in place details'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract country and city from address_components
        country = None
        city = None
        address_components = result.get('address_components', [])
        for component in address_components:
            types = component.get('types', [])
            if 'country' in types:
                country = component.get('long_name')
            if 'locality' in types:
                city = component.get('long_name')
        if not city:
            for component in address_components:
                if 'administrative_area_level_2' in component.get('types', []):
                    city = component.get('long_name')
                    break
        
        return Response({
            'latitude': location.get('lat'),
            'longitude': location.get('lng'),
            'address': result.get('formatted_address'),
            'country': country,
            'city': city,
        })
    except requests.RequestException as e:
        return Response(
            {'error': f'Failed to fetch place details: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def google_reverse_geocode(request):
    """
    Reverse geocode coordinates to get address components including country
    GET /api/google-maps/reverse-geocode/?lat=xxx&lng=xxx
    """
    api_key = _get_google_maps_api_key()
    if not api_key:
        return Response(
            {'error': 'Google Maps API key not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    
    if not lat or not lng:
        return Response(
            {'error': 'lat and lng parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'latlng': f'{lat},{lng}',
            'key': api_key,
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') != 'OK':
            return Response(
                {'error': f"Geocoding API error: {data.get('status')}", 'message': data.get('error_message')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = data.get('results', [])
        if not result:
            return Response(
                {'error': 'No results found for coordinates'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract country and city from address_components
        country = None
        city = None
        formatted_address = result[0].get('formatted_address')
        address_components = result[0].get('address_components', [])
        for component in address_components:
            types = component.get('types', [])
            if 'country' in types:
                country = component.get('long_name')
            if 'locality' in types:
                city = component.get('long_name')
        if not city:
            for component in address_components:
                if 'administrative_area_level_2' in component.get('types', []):
                    city = component.get('long_name')
                    break
        
        return Response({
            'address': formatted_address,
            'country': country,
            'city': city,
        })
    except requests.RequestException as e:
        return Response(
            {'error': f'Failed to reverse geocode: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
