import {useState, useEffect} from "react";
import {
  profileApi,
  providerApi,
  reservationApi,
  reviewApi,
  serviceApi,
  errorUtils,
} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {ClientProfile, ProfessionalProfile, PlaceProfile} from "@/types/global";

interface ProfileData {
  profile: ClientProfile | ProfessionalProfile | PlaceProfile | null;
  stats: {
    reservations?: number;
    reviews?: number;
    favorites?: number;
    services?: number;
    teamMembers?: number;
  };
  services?: any[];
  portfolio?: any[];
  teamMembers?: any[];
}

export const useUserProfile = () => {
  const {user, isAuthenticated} = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    profile: null,
    stats: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    if (!user || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let profile = null;
      let stats = {};
      let services = [];
      let portfolio = [];
      let teamMembers = [];

      // Fetch profile based on role
      switch (user.role) {
        case "CLIENT":
          try {
            const clientProfileResponse = await profileApi.getClientProfile(user.id);
            profile = clientProfileResponse.data;
          } catch (err) {
            // Profile might not exist yet, that's okay
            console.log("No client profile found");
          }

          // Fetch client stats
          try {
            const [reservationsRes, reviewsRes] = await Promise.all([
              reservationApi.getReservations({user: user.id}),
              reviewApi.listAll({user: user.id}),
            ]);

            stats = {
              reservations: reservationsRes.data.count || reservationsRes.data.results?.length || 0,
              reviews: reviewsRes.data.count || reviewsRes.data.results?.length || 0,
              favorites: 0, // TODO: Implement favorites
            };
          } catch (err) {
            console.log("Error fetching client stats:", err);
          }
          break;

        case "PROFESSIONAL":
          try {
            // Owner-scoped profile by user id for settings
            const professionalProfileResponse = await profileApi.getProfessionalProfile(user.id);
            profile = professionalProfileResponse.data;
          } catch (err) {
            console.log("No professional profile found");
          }

          // Fetch professional data
          try {
            const professionalId = (user as any).professional_profile?.id || user.id;
            const [servicesRes, reviewsRes] = await Promise.all([
              serviceApi.getProfessionalServices({professional: professionalId}),
              reviewApi.listProfessionals({professional: professionalId}),
            ]);

            services = servicesRes.data.results || [];
            const reviewsData = reviewsRes.data.results || [];

            stats = {
              services: services.length,
              reviews: reviewsData.length,
            };
          } catch (err) {
            console.log("Error fetching professional data:", err);
          }
          break;

        case "PLACE":
          try {
            // Owner-scoped profile by user id for settings
            const placeProfileResponse = await profileApi.getPlaceProfile(user.id);
            profile = placeProfileResponse.data;
          } catch (err) {
            console.log("No place profile found");
          }

          // Fetch place data
          try {
            const placeId = (user as any).place_profile?.id || user.id;
            const [servicesRes, reviewsRes] = await Promise.all([
              serviceApi.getPlaceServices({place: placeId}),
              reviewApi.listPlaces({place: placeId}),
            ]);

            services = servicesRes.data.results || [];
            const reviewsData = reviewsRes.data.results || [];

            stats = {
              services: services.length,
              reviews: reviewsData.length,
              teamMembers: 0, // TODO: Implement team members
            };
          } catch (err) {
            console.log("Error fetching place data:", err);
          }
          break;
      }

      setProfileData({
        profile,
        stats,
        services,
        portfolio,
        teamMembers,
      });
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id, isAuthenticated]);

  const refreshProfile = () => {
    fetchProfileData();
  };

  return {
    user,
    profile: profileData.profile,
    stats: profileData.stats,
    services: profileData.services,
    portfolio: profileData.portfolio,
    teamMembers: profileData.teamMembers,
    isLoading,
    error,
    refreshProfile,
  };
};
