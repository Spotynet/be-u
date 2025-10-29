"use client";

import {useState} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Card} from "@/components/ui/Card";
import {Service, CreateServiceData} from "@/types/api";

interface ServiceFormProps {
  service?: Service | null;
  onSubmit: (data: CreateServiceData) => Promise<void>;
  submitText: string;
}

export function ServiceForm({service, onSubmit, submitText}: ServiceFormProps) {
  const [formData, setFormData] = useState<CreateServiceData>({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    duration: service?.duration || "01:00:00", // Default 1 hour
    category: service?.category || "",
    sub_category: service?.sub_category || "",
    images: service?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Reset form after successful submission
      if (!service) {
        setFormData({
          name: "",
          description: "",
          price: 0,
          duration: "01:00:00",
          category: "",
          sub_category: "",
          images: [],
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateServiceData, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const formatDuration = (hours: number, minutes: number = 0) => {
    const h = hours.toString().padStart(2, "0");
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m}:00`;
  };

  const parseDuration = (duration: string) => {
    const [hours, minutes] = duration.split(":").map(Number);
    return {hours, minutes};
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Service Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter service name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe your service"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Price and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="pl-7"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
          <div className="flex space-x-2">
            <select
              value={parseDuration(formData.duration).hours}
              onChange={(e) => {
                const hours = parseInt(e.target.value);
                const minutes = parseDuration(formData.duration).minutes;
                handleInputChange("duration", formatDuration(hours, minutes));
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>
                  {i} hour{i !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <select
              value={parseDuration(formData.duration).minutes}
              onChange={(e) => {
                const minutes = parseInt(e.target.value);
                const hours = parseDuration(formData.duration).hours;
                handleInputChange("duration", formatDuration(hours, minutes));
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={0}>0 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <Input
          type="text"
          value={formData.category}
          onChange={(e) => handleInputChange("category", e.target.value)}
          placeholder="e.g., Healthcare, Beauty, Fitness"
        />
      </div>

      {/* Sub Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
        <Input
          type="text"
          value={formData.sub_category}
          onChange={(e) => handleInputChange("sub_category", e.target.value)}
          placeholder="e.g., Massage, Facial, Haircut"
        />
      </div>

      {/* Images Preview */}
      {formData.images && formData.images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
          <div className="flex flex-wrap gap-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">Image {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="px-6 py-2">
          {loading ? "Saving..." : submitText}
        </Button>
      </div>
    </form>
  );
}
