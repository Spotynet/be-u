from rest_framework import permissions


class IsPlaceOwner(permissions.BasePermission):
    """Permission for place owners to manage their services"""
    
    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must have PLACE role
        return request.user.role == 'PLACE'
    
    def has_object_permission(self, request, view, obj):
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user owns the place
        try:
            return obj.place.user == request.user
        except:
            return False


class IsProfessional(permissions.BasePermission):
    """Permission for professionals to manage their services"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.role == 'PROFESSIONAL'
    
    def has_object_permission(self, request, view, obj):
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user owns the professional profile
        try:
            return obj.professional.user == request.user
        except:
            return False


class IsServiceOwner(permissions.BasePermission):
    """Permission check for service owners (Place or Professional)"""
    
    def has_object_permission(self, request, view, obj):
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check ownership based on service type
        try:
            # For ServiceInPlace
            if hasattr(obj, 'place'):
                return obj.place.user == request.user
            # For ProfessionalService
            elif hasattr(obj, 'professional'):
                return obj.professional.user == request.user
        except:
            pass
        
        return False


class CanManageAvailability(permissions.BasePermission):
    """Permission for managing availability schedules"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only PROFESSIONAL and PLACE roles can manage availability
        return request.user.role in ['PROFESSIONAL', 'PLACE']
    
    def has_object_permission(self, request, view, obj):
        # Allow read access
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user owns the provider profile
        try:
            return obj.provider.user == request.user
        except:
            return False


