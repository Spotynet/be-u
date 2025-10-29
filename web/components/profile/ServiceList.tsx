"use client";

import {useState} from "react";
import {Button} from "@/components/ui/Button";
import {Card} from "@/components/ui/Card";
import {Service, CreateServiceData} from "@/types/api";
import {ServiceForm} from "./ServiceForm";

interface ServiceListProps {
  services: Service[];
  onUpdate: (id: number, data: Partial<CreateServiceData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleActive: (id: number) => Promise<void>;
}

export function ServiceList({services, onUpdate, onDelete, onToggleActive}: ServiceListProps) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<number | null>(null);

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(":").map(Number);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
  };

  const handleSaveEdit = async (data: CreateServiceData) => {
    if (editingService) {
      await onUpdate(editingService.id, data);
      setEditingService(null);
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      setDeletingService(serviceId);
      try {
        await onDelete(serviceId);
      } finally {
        setDeletingService(null);
      }
    }
  };

  const handleToggleActive = async (serviceId: number) => {
    await onToggleActive(serviceId);
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
        <p className="text-gray-500">Create your first service to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.id} className="p-6">
          {editingService?.id === service.id ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Service</h3>
                <Button variant="outline" onClick={handleCancelEdit} className="text-sm">
                  Cancel
                </Button>
              </div>
              <ServiceForm
                service={editingService}
                onSubmit={handleSaveEdit}
                submitText="Save Changes"
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-gray-600 mb-3">{service.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <span className="ml-1 text-gray-600">{formatPrice(service.price)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <span className="ml-1 text-gray-600">{formatDuration(service.duration)}</span>
                    </div>
                    {service.category && (
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="ml-1 text-gray-600">{service.category}</span>
                      </div>
                    )}
                    {service.sub_category && (
                      <div>
                        <span className="font-medium text-gray-700">Sub Category:</span>
                        <span className="ml-1 text-gray-600">{service.sub_category}</span>
                      </div>
                    )}
                  </div>

                  {service.images && service.images.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Images:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {service.images.map((image, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">Img {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="text-sm">
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(service.id)}
                    className={`text-sm ${
                      service.is_active
                        ? "text-orange-600 hover:text-orange-700"
                        : "text-green-600 hover:text-green-700"
                    }`}>
                    {service.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingService === service.id}
                    className="text-sm text-red-600 hover:text-red-700">
                    {deletingService === service.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-3">
                Created: {new Date(service.created_at).toLocaleDateString()}
                {service.updated_at !== service.created_at && (
                  <span className="ml-4">
                    Updated: {new Date(service.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
