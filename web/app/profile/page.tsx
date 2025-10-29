"use client";

import {useState, useEffect} from "react";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {publicProfileApi, serviceApi} from "@/lib/api";
import {PublicProfile, Service, CreatePublicProfileData, CreateServiceData} from "@/types/api";
import {PublicProfileForm} from "@/components/profile/PublicProfileForm";
import {ServiceForm} from "@/components/profile/ServiceForm";
import {ServiceList} from "@/components/profile/ServiceList";

export default function ProfilePage() {
  const {user, isAuthenticated} = useAuth();
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "services">("profile");

  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    }
  }, [isAuthenticated]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load public profile
      try {
        const profileResponse = await publicProfileApi.getMyProfile();
        setPublicProfile(profileResponse.data);
      } catch (err: any) {
        if (err.status === 404) {
          // User doesn't have a public profile yet
          setPublicProfile(null);
        } else {
          throw err;
        }
      }

      // Load services
      try {
        const servicesResponse = await serviceApi.getMyServices();
        setServices(servicesResponse.data);
      } catch (err: any) {
        console.error("Error loading services:", err);
        setServices([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (data: CreatePublicProfileData) => {
    try {
      const response = await publicProfileApi.createPublicProfile(data);
      setPublicProfile(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
      throw err;
    }
  };

  const handleUpdateProfile = async (data: Partial<CreatePublicProfileData>) => {
    if (!publicProfile) return;

    try {
      const response = await publicProfileApi.updatePublicProfile(publicProfile.id, data);
      setPublicProfile(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      throw err;
    }
  };

  const handleCreateService = async (data: CreateServiceData) => {
    try {
      const response = await serviceApi.createService(data);
      setServices((prev) => [...prev, response.data]);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to create service");
      throw err;
    }
  };

  const handleUpdateService = async (id: number, data: Partial<CreateServiceData>) => {
    try {
      const response = await serviceApi.updateService(id, data);
      setServices((prev) => prev.map((service) => (service.id === id ? response.data : service)));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to update service");
      throw err;
    }
  };

  const handleDeleteService = async (id: number) => {
    try {
      await serviceApi.deleteService(id);
      setServices((prev) => prev.filter((service) => service.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete service");
    }
  };

  const handleToggleServiceActive = async (id: number) => {
    try {
      const response = await serviceApi.toggleActive(id);
      setServices((prev) =>
        prev.map((service) =>
          service.id === id ? {...service, is_active: response.data.is_active} : service
        )
      );
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to toggle service status");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Authentication Required</h2>
            <p className="text-center text-gray-600">Please log in to access your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-600 mt-2">Manage your public profile and services</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Public Profile
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "services"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Services
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Public Profile</h2>
                  <p className="text-gray-600">
                    {publicProfile ? "Update your public profile" : "Create your public profile"}
                  </p>
                </CardHeader>
                <CardContent>
                  <PublicProfileForm
                    profile={publicProfile}
                    onSubmit={publicProfile ? handleUpdateProfile : handleCreateProfile}
                    submitText={publicProfile ? "Update Profile" : "Create Profile"}
                  />
                </CardContent>
              </Card>
            </div>

            {publicProfile && (
              <div>
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Profile Preview</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">{publicProfile.display_name}</h3>
                        <p className="text-sm text-gray-600">{publicProfile.profile_type}</p>
                      </div>
                      {publicProfile.description && (
                        <p className="text-gray-700">{publicProfile.description}</p>
                      )}
                      {publicProfile.category && (
                        <div>
                          <span className="text-sm font-medium">Category:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {publicProfile.category}
                          </span>
                        </div>
                      )}
                      {publicProfile.city && (
                        <div>
                          <span className="text-sm font-medium">Location:</span>
                          <span className="ml-2 text-sm text-gray-600">{publicProfile.city}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium">Rating:</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {publicProfile.rating}/5.0
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Add New Service</h2>
                  <p className="text-gray-600">Create a new service offering</p>
                </CardHeader>
                <CardContent>
                  <ServiceForm onSubmit={handleCreateService} submitText="Create Service" />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">My Services</h2>
                  <p className="text-gray-600">Manage your service offerings</p>
                </CardHeader>
                <CardContent>
                  <ServiceList
                    services={services}
                    onUpdate={handleUpdateService}
                    onDelete={handleDeleteService}
                    onToggleActive={handleToggleServiceActive}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
