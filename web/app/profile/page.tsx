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
                    {/* Two-row header */}
                    <div className="space-y-3">
                      {/* Row 1: avatar – name/role – settings */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-semibold">
                          {(publicProfile.display_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-semibold truncate">
                            {publicProfile.display_name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {publicProfile.profile_type === "PLACE" ? "Salón" : "Profesional"}
                          </div>
                        </div>
                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Settings">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M10.325 4.317a1 1 0 0 1 1.35-.436l.105.06 1.2.693a2 2 0 0 0 1.518.18l1.3-.372a1 1 0 0 1 1.24.69l.03.111.373 1.3a2 2 0 0 0 .88 1.152l1.2.694a1 1 0 0 1 .332 1.38l-.064.1-.693 1.2a2 2 0 0 0-.18 1.52l.372 1.299a1 1 0 0 1-.69 1.241l-.111.03-1.3.373a2 2 0 0 0-1.152.88l-.694 1.2a1 1 0 0 1-1.38.332l-.1-.064-1.2-.693a2 2 0 0 0-1.52-.18l-1.299.372a1 1 0 0 1-1.241-.69l-.03-.111-.373-1.3a2 2 0 0 0-.88-1.152l-1.2-.694a1 1 0 0 1-.332-1.38l.064-.1.693-1.2a2 2 0 0 0 .18-1.52l-.372-1.299a1 1 0 0 1 .69-1.241l.111-.03 1.3-.373a2 2 0 0 0 1.152-.88l.694-1.2ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                          </svg>
                        </button>
                      </div>

                      {/* Row 2: actions */}
                      <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-pink-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
                          </svg>
                          Personalizar Perfil
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="inline-flex items-center gap-2 border text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-50">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5L19.5 6.75m0 0L15.75 3m3.75 3.75H8.25a4.5 4.5 0 00-4.5 4.5v6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75L4.5 10.5m0 0L8.25 14.25M4.5 10.5h11.25a4.5 4.5 0 014.5 4.5v2.25" />
                          </svg>
                          Ver como cliente
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-6 space-y-3">
                      {publicProfile.description && (
                        <p className="text-gray-700">{publicProfile.description}</p>
                      )}
                      {publicProfile.category && (
                        <div>
                          <span className="text-sm font-medium">Category:</span>
                          <span className="ml-2 text-sm text-gray-600">{publicProfile.category}</span>
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
                        <span className="ml-2 text-sm text-gray-600">{publicProfile.rating}/5.0</span>
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
