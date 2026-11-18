"use client";

import {useState, useRef} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {Textarea} from "@/components/ui/Textarea";
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
      setError(err.message || "No se pudo guardar el perfil");
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
      setError("Tipo de archivo no válido. Usa JPEG, PNG, GIF o WebP.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo 5 MB.");
      return;
    }

    // Check image limit
    if (formData.images && formData.images.length >= 10) {
      setError("Máximo 10 imágenes por perfil.");
      return;
    }

    if (!profile) {
      setError("Crea tu perfil primero para subir imágenes.");
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
      setError(err.message || "No se pudo subir la imagen");
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
      setError(err.message || "No se pudo eliminar la imagen");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <CustomDropdown
        label="Tipo de perfil"
        value={formData.profile_type}
        onChange={(value) => {
          if (value) handleInputChange("profile_type", value);
        }}
        options={[
          {value: "PROFESSIONAL", label: "Profesional"},
          {value: "PLACE", label: "Lugar"},
        ]}
        searchable={false}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Ana"
          required
        />

        {formData.profile_type === "PROFESSIONAL" && (
          <Input
            label="Apellido"
            type="text"
            value={formData.last_name}
            onChange={(e) => handleInputChange("last_name", e.target.value)}
            placeholder="García"
            required={formData.profile_type === "PROFESSIONAL"}
          />
        )}
      </div>

      <Textarea
        label="Descripción"
        value={formData.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        placeholder="Describe tu perfil"
        rows={3}
      />

      {formData.profile_type === "PROFESSIONAL" && (
        <Textarea
          label="Bio"
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          placeholder="Cuéntale a tus clientes qué haces"
          rows={3}
        />
      )}

      <Input
        label="Categoría"
        type="text"
        value={formData.category}
        onChange={(e) => handleInputChange("category", e.target.value)}
        placeholder="Belleza, bienestar..."
      />

      <Input
        label="Subcategorías"
        type="text"
        value={(formData.sub_categories ?? []).join(", ")}
        onChange={(e) => handleSubCategoriesChange(e.target.value)}
        placeholder="Cabello, spa, yoga"
        helperText="Separa varias con comas"
      />

      {formData.profile_type === "PLACE" && (
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-foreground tracking-tight">Dirección</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Calle"
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="Calle y colonia"
              required={formData.profile_type === "PLACE"}
            />
            <Input
              label="Ciudad"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Ciudad"
              required={formData.profile_type === "PLACE"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Número exterior"
              type="text"
              value={formData.number_ext}
              onChange={(e) => handleInputChange("number_ext", e.target.value)}
              placeholder="Ext."
            />
            <Input
              label="Número interior"
              type="text"
              value={formData.number_int}
              onChange={(e) => handleInputChange("number_int", e.target.value)}
              placeholder="Int."
            />
            <Input
              label="Código postal"
              type="text"
              value={formData.postal_code}
              onChange={(e) => handleInputChange("postal_code", e.target.value)}
              placeholder="CP"
            />
          </div>

          <Input
            label="País"
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            placeholder="País"
          />
        </div>
      )}

      <label className="auth-terms">
        <input
          type="checkbox"
          id="has_calendar"
          checked={formData.has_calendar}
          onChange={(e) => handleInputChange("has_calendar", e.target.checked)}
          className="auth-checkbox"
        />
        <span>Activar calendario para reservas</span>
      </label>

      <div>
        <p className="nabbi-field__label" style={{marginBottom: 10}}>
          Imágenes del perfil ({formData.images?.length || 0}/10)
        </p>

        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {formData.images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-24 object-cover rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-error text-error-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar imagen">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {profile && formData.images && formData.images.length < 10 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button type="button" onClick={openFileDialog} disabled={uploadingImage} variant="outline" className="w-full">
              {uploadingImage ? "Subiendo..." : "Agregar imagen"}
            </Button>
            <p className="nabbi-field__hint" style={{marginTop: 8}}>
              Máximo 10 imágenes, 5 MB cada una. JPEG, PNG, GIF o WebP.
            </p>
          </div>
        )}

        {!profile && (
          <p className="nabbi-field__hint">Crea tu perfil primero para subir imágenes.</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : submitText}
        </Button>
      </div>
    </form>
  );
}
