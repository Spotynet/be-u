from rest_framework.routers import DefaultRouter
from .views import FavoriteViewSet

router = DefaultRouter()
# Mount viewset at root so /api/favorites/ works with include path
router.register(r'', FavoriteViewSet, basename='favorite')

urlpatterns = router.urls

