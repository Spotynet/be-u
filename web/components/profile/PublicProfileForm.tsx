"use client";

import {useState, useRef} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Card} from "@/components/ui/Card";
import {PublicProfile, CreatePublicProfileData} from "@/types/api";
import {publicProfileApi} from "@/lib/api";

interface PublicProfileFormProps {
  profile?: PublicProfile | null;
  onSubmit: (data: CreatePublicProfileData) => Promise<void>;
  submitText: string;
}

export function PublicProfileForm({profile, onSubmit, submitText}: PublicProfileFormProps) {
  const [formData, setFormData] = useState<CreatePublicProfileData>({
    profile_type: profile?.profile_type || "PROFESSIONAL",
    name: profile?.name || "",
    description: profile?.description || "",
    category: profile?.category || "",
    sub_categories: profile?.sub_categories || [],
    images: profile?.images || [],
    linked_pros_place: profile?.linked_pros_place || [],
    has_calendar: profile?.has_calendar || false,
    street: profile?.street || "",
    number_ext: profile?.number_ext || "",
    number_int: profile?.number_int || "",
    postal_code: profile?.postal_code || "",
    city: profile?.city || "",
    country: profile?.country || "",
    last_name: profile?.last_name || "",
    bio: profile?.bio || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePublicProfileData, value: any) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const handleSubCategoriesChange = (value: string) => {
    const categories = value
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat);
    setFormData((prev) => ({...prev, sub_categories: categories}));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    // Check image limit
    if (formData.images && formData.images.length >= 10) {
      setError("Maximum of 10 images allowed per profile.");
      return;
    }

    if (!profile) {
      setError("Please create your profile first before uploading images.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const response = await publicProfileApi.uploadImage(profile.id, file);
      setFormData((prev) => ({
        ...prev,
        images: response.data.images || [],
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (imageIndex: number) => {
    if (!profile) return;

    try {
      const response = await publicProfileApi.removeImage(profile.id, imageIndex);
      setFormData((prev) => ({
        ...prev,
        images: response.data.images || [],
      }));
    } catch (err: any) {
      setError(err.message || "Failed to remove image");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Type *</label>
        <select
          value={formData.profile_type}
          onChange={(e) => handleInputChange("profile_type", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required>
          <option value="PROFESSIONAL">Professional</option>
          <option value="PLACE">Place</option>
        </select>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter profile name"
            required
          />
        </div>

        {formData.profile_type === "PROFESSIONAL" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <Input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              placeholder="Enter last name"
              required={formData.profile_type === "PROFESSIONAL"}
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe your profile"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bio (for professionals) */}
      {formData.profile_type === "PROFESSIONAL" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            placeholder="Tell us about yourself"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

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

      {/* Sub Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Categories</label>
        <Input
          type="text"
          value={formData.sub_categories.join(", ")}
          onChange={(e) => handleSubCategoriesChange(e.target.value)}
          placeholder="e.g., Massage, Facial, Haircut (comma separated)"
        />
        <p className="text-sm text-gray-500 mt-1">Separate multiple categories with commas</p>
      </div>

      {/* Address Fields (for places) */}
      {formData.profile_type === "PLACE" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
              <Input
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                placeholder="Street address"
                required={formData.profile_type === "PLACE"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                required={formData.profile_type === "PLACE"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number Ext</label>
              <Input
                type="text"
                value={formData.number_ext}
                onChange={(e) => handleInputChange("number_ext", e.target.value)}
                placeholder="External number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number Int</label>
              <Input
                type="text"
                value={formData.number_int}
                onChange={(e) => handleInputChange("number_int", e.target.value)}
                placeholder="Internal number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <Input
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                placeholder="Postal code"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <Input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              placeholder="Country"
            />
          </div>
        </div>
      )}

      {/* Calendar Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="has_calendar"
          checked={formData.has_calendar}
          onChange={(e) => handleInputChange("has_calendar", e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="has_calendar" className="ml-2 block text-sm text-gray-900">
          Enable calendar functionality for bookings
        </label>
      </div>

      {/* Images Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Images ({formData.images?.length || 0}/10)
        </label>

        {/* Image Gallery */}
        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {formData.images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Profile image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {profile && formData.images && formData.images.length < 10 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={openFileDialog}
              disabled={uploadingImage}
              variant="outline"
              className="w-full">
              {uploadingImage ? "Uploading..." : "Add Image"}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Max 10 images, 5MB each. Supported: JPEG, PNG, GIF, WebP
            </p>
          </div>
        )}

        {!profile && (
          <p className="text-sm text-gray-500 italic">Create your profile first to upload images</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="px-6 py-2">
          {loading ? "Saving..." : submitText}
        </Button>
      </div>
    </form>
  );
}
