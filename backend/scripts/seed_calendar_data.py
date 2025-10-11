"""
Script to seed test data for calendar and reservation system
Run with: python manage.py shell < scripts/seed_calendar_data.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from datetime import timedelta, time, date
from users.models import User, ClientProfile, ProfessionalProfile, PlaceProfile
from services.models import (
    ServicesCategory, ServicesType, ServiceInPlace, 
    ProfessionalService, ProviderAvailability
)
from django.contrib.contenttypes.models import ContentType

def seed_data():
    print("🌱 Seeding calendar and reservation test data...")
    
    # Create service categories if they don't exist
    categories_data = [
        {"name": "Belleza y Cuidado", "description": "Servicios de belleza"},
        {"name": "Bienestar y Ejercicio", "description": "Servicios de wellness"},
        {"name": "Mascotas", "description": "Servicios para mascotas"},
    ]
    
    for cat_data in categories_data:
        category, created = ServicesCategory.objects.get_or_create(
            name=cat_data["name"],
            defaults=cat_data
        )
        if created:
            print(f"✅ Created category: {category.name}")
    
    # Create service types
    belleza_cat = ServicesCategory.objects.get(name="Belleza y Cuidado")
    wellness_cat = ServicesCategory.objects.get(name="Bienestar y Ejercicio")
    
    service_types_data = [
        {"category": belleza_cat, "name": "Corte de Cabello", "description": "Corte profesional"},
        {"category": belleza_cat, "name": "Tratamiento Facial", "description": "Limpieza y cuidado facial"},
        {"category": belleza_cat, "name": "Manicure", "description": "Cuidado de uñas"},
        {"category": wellness_cat, "name": "Masaje Relajante", "description": "Masaje de cuerpo completo"},
        {"category": wellness_cat, "name": "Yoga", "description": "Clase de yoga"},
    ]
    
    for st_data in service_types_data:
        service_type, created = ServicesType.objects.get_or_create(
            category=st_data["category"],
            name=st_data["name"],
            defaults=st_data
        )
        if created:
            print(f"✅ Created service type: {service_type.name}")
    
    # Create test users if they don't exist
    # Professional user
    prof_user, created = User.objects.get_or_create(
        email="professional@test.com",
        defaults={
            "username": "professional_test",
            "first_name": "Ana",
            "last_name": "López",
            "role": "PROFESSIONAL"
        }
    )
    if created:
        prof_user.set_password("testpass123")
        prof_user.save()
        print(f"✅ Created professional user: {prof_user.email}")
    
    # Create professional profile
    prof_profile, created = ProfessionalProfile.objects.get_or_create(
        user=prof_user,
        defaults={
            "name": "Ana",
            "last_name": "López",
            "bio": "Estilista profesional con 10 años de experiencia",
            "city": "Ciudad de México",
            "rating": 4.9
        }
    )
    if created:
        print(f"✅ Created professional profile")
    
    # Place user
    place_user, created = User.objects.get_or_create(
        email="place@test.com",
        defaults={
            "username": "place_test",
            "first_name": "BE-U",
            "last_name": "Spa",
            "role": "PLACE"
        }
    )
    if created:
        place_user.set_password("testpass123")
        place_user.save()
        print(f"✅ Created place user: {place_user.email}")
    
    # Create place profile
    place_profile, created = PlaceProfile.objects.get_or_create(
        user=place_user,
        defaults={
            "name": "BE-U Spa Premium",
            "street": "Av. Reforma",
            "number_ext": "100",
            "postal_code": "06600",
            "city": "Ciudad de México",
            "country": "México"
        }
    )
    if created:
        print(f"✅ Created place profile")
    
    # Client user
    client_user, created = User.objects.get_or_create(
        email="client@test.com",
        defaults={
            "username": "client_test",
            "first_name": "María",
            "last_name": "García",
            "role": "CLIENT"
        }
    )
    if created:
        client_user.set_password("testpass123")
        client_user.save()
        print(f"✅ Created client user: {client_user.email}")
    
    # Create client profile
    client_profile, created = ClientProfile.objects.get_or_create(
        user=client_user,
        defaults={
            "phone": "+52 55 1234 5678"
        }
    )
    if created:
        print(f"✅ Created client profile")
    
    # Create professional services
    corte_service = ServicesType.objects.get(name="Corte de Cabello")
    prof_service, created = ProfessionalService.objects.get_or_create(
        professional=prof_profile,
        service=corte_service,
        defaults={
            "description": "Corte de cabello profesional con asesoría de estilo",
            "time": timedelta(minutes=45),
            "price": 350,
            "is_active": True
        }
    )
    if created:
        print(f"✅ Created professional service: {prof_service}")
    
    # Create place services
    facial_service = ServicesType.objects.get(name="Tratamiento Facial")
    place_service, created = ServiceInPlace.objects.get_or_create(
        place=place_profile,
        service=facial_service,
        defaults={
            "description": "Tratamiento facial completo con productos premium",
            "time": timedelta(minutes=60),
            "price": 800,
            "is_active": True
        }
    )
    if created:
        print(f"✅ Created place service: {place_service}")
    
    # Set availability for professional (Monday to Friday, 9 AM - 6 PM)
    prof_ct = ContentType.objects.get_for_model(ProfessionalProfile)
    for day in range(5):  # Monday to Friday
        availability, created = ProviderAvailability.objects.get_or_create(
            content_type=prof_ct,
            object_id=prof_profile.id,
            day_of_week=day,
            defaults={
                "start_time": time(9, 0),
                "end_time": time(18, 0),
                "is_active": True
            }
        )
        if created:
            print(f"✅ Set availability for {availability.get_day_of_week_display()}")
    
    # Set availability for place (Monday to Saturday, 8 AM - 8 PM)
    place_ct = ContentType.objects.get_for_model(PlaceProfile)
    for day in range(6):  # Monday to Saturday
        availability, created = ProviderAvailability.objects.get_or_create(
            content_type=place_ct,
            object_id=place_profile.id,
            day_of_week=day,
            defaults={
                "start_time": time(8, 0),
                "end_time": time(20, 0),
                "is_active": True
            }
        )
        if created:
            print(f"✅ Set availability for place: {availability.get_day_of_week_display()}")
    
    print("\n🎉 Seed data completed!")
    print("\n📝 Test accounts created:")
    print(f"   Client:       client@test.com / testpass123")
    print(f"   Professional: professional@test.com / testpass123")
    print(f"   Place:        place@test.com / testpass123")
    print("\n🔧 You can now test the calendar and reservation system!")

if __name__ == "__main__":
    seed_data()




