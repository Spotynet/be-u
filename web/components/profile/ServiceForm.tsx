"use client";

import {useState} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {Textarea} from "@/components/ui/Textarea";
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
    duration: service?.duration || "01:00:00",
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
      setError(err.message || "No se pudo guardar el servicio");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <Input
        label="Nombre del servicio"
        type="text"
        value={formData.name}
        onChange={(e) => handleInputChange("name", e.target.value)}
        placeholder="Corte y color"
        required
      />

      <Textarea
        label="Descripción"
        value={formData.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        placeholder="Describe tu servicio"
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Precio"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <CustomDropdown
            label="Horas"
            value={parseDuration(formData.duration).hours}
            onChange={(hours) => {
              if (hours === null) return;
              const minutes = parseDuration(formData.duration).minutes;
              handleInputChange("duration", formatDuration(hours, minutes));
            }}
            options={Array.from({length: 24}, (_, i) => ({
              value: i,
              label: `${i} h`,
            }))}
            searchable="auto"
          />
          <CustomDropdown
            label="Minutos"
            value={parseDuration(formData.duration).minutes}
            onChange={(minutes) => {
              if (minutes === null) return;
              const hours = parseDuration(formData.duration).hours;
              handleInputChange("duration", formatDuration(hours, minutes));
            }}
            options={[
              {value: 0, label: "0"},
              {value: 15, label: "15"},
              {value: 30, label: "30"},
              {value: 45, label: "45"},
            ]}
            searchable={false}
          />
        </div>
      </div>

      <Input
        label="Categoría"
        type="text"
        value={formData.category}
        onChange={(e) => handleInputChange("category", e.target.value)}
        placeholder="Belleza, bienestar..."
      />

      <Input
        label="Subcategoría"
        type="text"
        value={formData.sub_category}
        onChange={(e) => handleInputChange("sub_category", e.target.value)}
        placeholder="Cabello, spa..."
      />

      {formData.images && formData.images.length > 0 && (
        <div>
          <p className="nabbi-field__label" style={{marginBottom: 8}}>
            Imágenes actuales
          </p>
          <div className="flex flex-wrap gap-2">
            {formData.images.map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={image}
                alt={`Imagen ${index + 1}`}
                className="w-20 h-20 object-cover rounded-xl border border-border"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : submitText}
        </Button>
      </div>
    </form>
  );
}
