#!/usr/bin/env python
"""
Script to check Place-Professional Links in the database
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.profile_models import PlaceProfessionalLink, PlaceProfile, ProfessionalProfile
from users.models import User, PublicProfile

def main():
    print("=" * 80)
    print("CHECKING PLACE-PROFESSIONAL LINKS")
    print("=" * 80)
    
    # Get all links
    all_links = PlaceProfessionalLink.objects.all()
    print(f"\n📊 Total links in database: {all_links.count()}")
    
    if all_links.count() == 0:
        print("\n⚠️  NO LINKS FOUND IN DATABASE!")
        print("\nTo create links, you need to:")
        print("1. Have a PlaceProfile and a ProfessionalProfile")
        print("2. Use the /links/ API endpoint to create a link")
        print("3. Or use the Django admin to create links manually")
        return
    
    # Show all links
    print("\n" + "-" * 80)
    print("ALL LINKS:")
    print("-" * 80)
    for link in all_links:
        print(f"\nLink ID: {link.id}")
        print(f"  Status: {link.status}")
        print(f"  Place ID: {link.place.id if link.place else 'N/A'}")
        print(f"  Place Name: {link.place.name if link.place else 'N/A'}")
        try:
            place_public_profile = PublicProfile.objects.get(user=link.place.user, profile_type='PLACE')
            print(f"  Place Public Profile ID: {place_public_profile.id}")
        except:
            print(f"  Place Public Profile ID: NOT FOUND")
        
        print(f"  Professional ID: {link.professional.id if link.professional else 'N/A'}")
        try:
            prof_user = link.professional.user
            print(f"  Professional Name: {prof_user.first_name} {prof_user.last_name}")
        except:
            print(f"  Professional Name: N/A")
        try:
            prof_public_profile = PublicProfile.objects.get(user=link.professional.user, profile_type='PROFESSIONAL')
            print(f"  Professional Public Profile ID: {prof_public_profile.id}")
        except:
            print(f"  Professional Public Profile ID: NOT FOUND")
        print(f"  Created: {link.created_at}")
    
    # Show accepted links
    accepted_links = PlaceProfessionalLink.objects.filter(status='ACCEPTED')
    print("\n" + "=" * 80)
    print(f"ACCEPTED LINKS: {accepted_links.count()}")
    print("=" * 80)
    
    # Check specific place (ID 3 from the logs)
    print("\n" + "=" * 80)
    print("CHECKING PLACE ID 3 (from logs):")
    print("=" * 80)
    try:
        place = PlaceProfile.objects.get(id=3)
        print(f"\n✅ Place found: {place.name}")
        print(f"   User ID: {place.user.id}")
        place_links = PlaceProfessionalLink.objects.filter(place=place, status='ACCEPTED')
        print(f"   Accepted links: {place_links.count()}")
        
        if place_links.count() == 0:
            print("\n   ⚠️  This place has NO accepted links!")
        else:
            for link in place_links:
                try:
                    prof_user = link.professional.user
                    print(f"   - Linked to: {prof_user.first_name} {prof_user.last_name} (Prof ID: {link.professional.id})")
                except:
                    print(f"   - Linked to: Professional ID {link.professional.id}")
    except PlaceProfile.DoesNotExist:
        print("\n❌ Place with ID 3 not found in database!")
    
    # List all places and professionals
    print("\n" + "=" * 80)
    print("ALL PLACES:")
    print("=" * 80)
    all_places = PlaceProfile.objects.all()
    for place in all_places:
        try:
            public_profile = PublicProfile.objects.get(user=place.user, profile_type='PLACE')
            print(f"\nPlace ID: {place.id} | Public Profile ID: {public_profile.id}")
            print(f"  Name: {place.name}")
            print(f"  User ID: {place.user.id}")
            links_count = PlaceProfessionalLink.objects.filter(place=place, status='ACCEPTED').count()
            print(f"  Accepted links: {links_count}")
        except PublicProfile.DoesNotExist:
            print(f"\nPlace ID: {place.id} | ❌ No Public Profile")
            print(f"  Name: {place.name}")
    
    print("\n" + "=" * 80)
    print("ALL PROFESSIONALS:")
    print("=" * 80)
    all_profs = ProfessionalProfile.objects.all()
    for prof in all_profs:
        try:
            public_profile = PublicProfile.objects.get(user=prof.user, profile_type='PROFESSIONAL')
            print(f"\nProfessional ID: {prof.id} | Public Profile ID: {public_profile.id}")
            print(f"  Name: {prof.user.first_name} {prof.user.last_name}")
            print(f"  User ID: {prof.user.id}")
            links_count = PlaceProfessionalLink.objects.filter(professional=prof, status='ACCEPTED').count()
            print(f"  Accepted links: {links_count}")
        except PublicProfile.DoesNotExist:
            print(f"\nProfessional ID: {prof.id} | ❌ No Public Profile")
            print(f"  Name: {prof.user.first_name} {prof.user.last_name}")

if __name__ == '__main__':
    main()

