#!/usr/bin/env python3
"""
Script para probar el backend Django
"""
import requests
import json

BASE_URL = "http://localhost:3000/api"

def test_endpoint(endpoint, method="GET", data=None):
    """Prueba un endpoint específico"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        
        print(f"✅ {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        print()
        
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint}")
        print(f"   Error: No se puede conectar al servidor")
        print(f"   Asegúrate de que el backend esté ejecutándose en http://localhost:3000")
        print()
    except Exception as e:
        print(f"❌ {method} {endpoint}")
        print(f"   Error: {e}")
        print()

def main():
    print("🧪 Probando Backend Django...")
    print("=" * 50)
    
    # Test básico
    test_endpoint("/test/")
    
    # Test login
    test_endpoint("/auth/login/", "POST", {
        "email": "test@example.com",
        "password": "password"
    })
    
    # Test registro
    test_endpoint("/auth/register/", "POST", {
        "firstName": "Juan",
        "lastName": "Pérez", 
        "email": "juan@test.com",
        "password": "123456"
    })
    
    # Test users
    test_endpoint("/users/")
    
    print("=" * 50)
    print("✨ Pruebas completadas!")

if __name__ == "__main__":
    main()

