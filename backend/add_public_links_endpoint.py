"""
Script to add the public links endpoint to PublicProfileViewSet
This will allow fetching linked professionals without authentication

Add this action method to your PublicProfileViewSet in users/views.py:
"""

ENDPOINT_CODE = '''
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def links(self, request, pk=None):
        """
        Public endpoint to get links for a profile (professionals or places).
        Returns linked professionals if PLACE, or linked places if PROFESSIONAL.
        No authentication required.
        
        URL: GET /api/public-profiles/{id}/links/?status=ACCEPTED
        """
        try:
            from users.profile_models import PlaceProfessionalLink, PlaceProfile, ProfessionalProfile
            
            # Get the public profile
            public_profile = self.get_object()
            
            # Get status filter from query params (default to ACCEPTED)
            status_filter = request.query_params.get('status', 'ACCEPTED')
            
            if public_profile.profile_type == 'PLACE':
                # Find the PlaceProfile associated with this public profile
                try:
                    place_profile = PlaceProfile.objects.get(user=public_profile.user)
                    # Get links where this place is the place
                    links = PlaceProfessionalLink.objects.filter(
                        place=place_profile,
                        status=status_filter
                    ).select_related('professional', 'professional__user')
                except PlaceProfile.DoesNotExist:
                    return Response([], status=status.HTTP_200_OK)
                    
            elif public_profile.profile_type == 'PROFESSIONAL':
                # Find the ProfessionalProfile associated with this public profile
                try:
                    prof_profile = ProfessionalProfile.objects.get(user=public_profile.user)
                    # Get links where this professional is the professional
                    links = PlaceProfessionalLink.objects.filter(
                        professional=prof_profile,
                        status=status_filter
                    ).select_related('place', 'place__user')
                except ProfessionalProfile.DoesNotExist:
                    return Response([], status=status.HTTP_200_OK)
            else:
                return Response([], status=status.HTTP_200_OK)
            
            # Serialize the links
            from users.profile_serializers import PlaceProfessionalLinkSerializer
            serializer = PlaceProfessionalLinkSerializer(links, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error in public profile links endpoint: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
'''

print("=" * 80)
print("ADD PUBLIC LINKS ENDPOINT TO BACKEND")
print("=" * 80)
print("\n1. Open the file: backend/users/views.py")
print("\n2. Find the PublicProfileViewSet class")
print("\n3. Add this import at the top of the file if not already there:")
print("   from rest_framework.decorators import action")
print("   from rest_framework.permissions import AllowAny")
print("\n4. Add this method to the PublicProfileViewSet class:")
print(ENDPOINT_CODE)
print("\n5. Restart your Django server")
print("\n6. Test the endpoint:")
print("   curl http://127.0.0.1:8000/api/public-profiles/11/links/?status=ACCEPTED")
print("\n" + "=" * 80)

