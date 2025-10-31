#!/usr/bin/env python3
"""
Test script for profile customization API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_profile_customization_endpoints():
    """Test the profile customization endpoints"""
    
    # Test data
    test_data = {
        "images": [
            {
                "image": "test_image.jpg",
                "caption": "Test image",
                "is_primary": True,
                "order": 0
            }
        ],
        "services": [
            {
                "name": "Test Service",
                "description": "A test service",
                "price": 50.00,
                "duration_minutes": 60,
                "category": "Belleza",
                "is_active": True
            }
        ],
        "availability": [
            {
                "day_of_week": 0,  # Monday
                "is_available": True,
                "time_slots": [
                    {
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "is_active": True
                    }
                ]
            }
        ]
    }
    
    print("Testing Profile Customization API Endpoints")
    print("=" * 50)
    
    # Test 1: Get profile customization (should work without auth for testing)
    print("\n1. Testing GET /profile/customization/")
    try:
        response = requests.get(f"{BASE_URL}/profile/customization/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ GET profile customization works")
        else:
            print(f"❌ GET failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Test service creation endpoint
    print("\n2. Testing POST /profile/services/")
    try:
        response = requests.post(
            f"{BASE_URL}/profile/services/",
            json=test_data["services"][0]
        )
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201, 401]:  # 401 is expected without auth
            print("✅ POST services endpoint exists")
        else:
            print(f"❌ POST failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Test availability endpoint
    print("\n3. Testing POST /profile/availability/")
    try:
        response = requests.post(
            f"{BASE_URL}/profile/availability/",
            json=test_data["availability"]
        )
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 201, 401]:  # 401 is expected without auth
            print("✅ POST availability endpoint exists")
        else:
            print(f"❌ POST failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_profile_customization_endpoints()
















