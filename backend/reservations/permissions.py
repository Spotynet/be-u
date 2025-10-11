from rest_framework import permissions


class IsReservationClient(permissions.BasePermission):
    """Permission for clients to manage their own reservations"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Client can view and cancel their own reservations
        try:
            return obj.client.user == request.user
        except:
            return False


class IsReservationProvider(permissions.BasePermission):
    """Permission for providers (Professional/Place) to manage incoming reservations"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Must be PROFESSIONAL or PLACE
        return request.user.role in ['PROFESSIONAL', 'PLACE']
    
    def has_object_permission(self, request, view, obj):
        # Check if user is the provider of this reservation
        try:
            return obj.provider.user == request.user
        except:
            return False


class CanViewReservation(permissions.BasePermission):
    """Permission to view reservations (client or provider)"""
    
    def has_object_permission(self, request, view, obj):
        try:
            # Client can view their own
            if obj.client.user == request.user:
                return True
            
            # Provider can view their incoming reservations
            if obj.provider.user == request.user:
                return True
        except:
            pass
        
        return False


