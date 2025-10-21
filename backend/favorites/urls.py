from rest_framework.routers import DefaultRouter
from .views import FavoriteViewSet

router = DefaultRouter()
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = router.urls

