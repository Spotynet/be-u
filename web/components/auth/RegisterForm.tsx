"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {RegisterData} from "@/features/auth/types";

// ─── Brand tokens (mirrors landing page) ────────────────────────────────────
const INK   = "#12211A";   // verde casi negro
const DARK  = "#1F3328";   // bosque profundo
const MAIN  = "#558367";   // verde salvia
const ACCENT= "#F6C531";   // amarillo vibrante — CTA principal
/** Verde salvia claro — --color-primary-light (brandbook / landing) */
const FORM_BG = `linear-gradient(165deg, #ecf6ef 0%, #d8eae0 45%, #e6f2eb 100%)`;
const LABEL = "#3d6050";   // verde apagado — labels

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "white",
  border: "1.5px solid rgba(85,131,103,0.22)",
  borderRadius: 12,
  color: DARK,
  fontSize: 14,
  fontWeight: 500,
  padding: "11px 42px 11px 14px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box" as const,
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label style={{display:"block", color:DARK, fontSize:12, fontWeight:600, marginBottom:6}}>
        {label}
      </label>
      <div style={{position:"relative"}}>
        <input
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputBase}
          onFocus={e => {
            e.currentTarget.style.borderColor = MAIN;
            e.currentTarget.style.boxShadow  = `0 0 0 3px rgba(85,131,103,0.15)`;
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "rgba(85,131,103,0.22)";
            e.currentTarget.style.boxShadow   = "none";
          }}
        />
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:LABEL,display:"flex"}}>
          {icon}
        </span>
      </div>
    </div>
  );
}

const IconUser = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
  </svg>
);
const IconEmail = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
  </svg>
);
const MAIN_CATEGORIES = [
  {id: "belleza", name: "Belleza"},
  {id: "bienestar", name: "Bienestar"},
  {id: "mascotas", name: "Mascotas"},
];

const SUB_CATEGORIES: Record<string, Array<{id: string; name: string}>> = {
  belleza: [
    {id: "cabello", name: "Cabello"},
    {id: "pestanas", name: "Pestañas"},
    {id: "cejas", name: "Cejas"},
    {id: "maquillaje_peinado", name: "Maquillaje"},
    {id: "manos_pies", name: "Manos y Pies"},
    {id: "faciales", name: "Faciales"},
    {id: "barberia", name: "Barbería"},
  ],
  bienestar: [
    {id: "spa_relajacion", name: "Spa"},
    {id: "yoga", name: "Yoga"},
    {id: "meditacion", name: "Meditación"},
    {id: "access_bar", name: "Access Bar"},
    {id: "pilates", name: "Pilates"},
    {id: "breathwork", name: "Breathwork"},
    {id: "acupuntura", name: "Acupuntura"},
    {id: "fisioterapia", name: "Fisioterapia"},
    {id: "psicoterapia_coaching", name: "Psicoterapia"},
    {id: "terapia_holistica", name: "Holística"},
    {id: "nutricion_alimentacion", name: "Nutrición"},
  ],
  mascotas: [
    {id: "estetica_mascotas", name: "Estética"},
    {id: "spa_mascotas", name: "Spa"},
    {id: "cuidadores", name: "Cuidadores"},
    {id: "paseadores", name: "Paseadores"},
    {id: "guarderias", name: "Guarderías"},
    {id: "otros", name: "Otros"},
  ],
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  paddingRight: 14,
  appearance: "none",
};

export const RegisterForm = () => {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    role: "client" as "client" | "professional",
    firstName: "",
    lastName: "",
    username: "",
    email: searchParams.get("email") || "",
    phone: "",
    city: "",
    bio: "",
    address: "",
    country: "",
    category: "",
    subcategory: "",
    acceptedTerms: false,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const {register, error, clearError, isLoading} = useAuth();
  const router = useRouter();
  const availableSubcategories = SUB_CATEGORIES[formData.category] || [];

  const clearMessages = () => {
    setLocalError(null);
    if (error) clearError();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const {name, value, type} = e.target;
    clearMessages();
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" && "checked" in e.target
          ? (e.target as HTMLInputElement).checked
          : value,
      ...(name === "category" ? {subcategory: ""} : {}),
    }));
  };

  const validate = () => {
    const trimmed = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      bio: formData.bio.trim(),
      address: formData.address.trim(),
      country: formData.country.trim(),
    };

    if (!trimmed.firstName || !trimmed.username || !trimmed.email) {
      setLocalError("Completa nombre, usuario y correo electrónico para continuar.");
      return null;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed.email)) {
      setLocalError("Ingresa un correo electrónico válido.");
      return null;
    }
    if (!formData.acceptedTerms) {
      setLocalError("Debes aceptar los términos y condiciones para crear tu cuenta.");
      return null;
    }
    if (formData.role === "professional" && (!formData.category || !formData.subcategory)) {
      setLocalError("Selecciona una categoría y una subcategoría para tu perfil profesional.");
      return null;
    }

    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = validate();
    if (!trimmed) return;

    try {
      const registerData: RegisterData = {
        firstName: trimmed.firstName,
        lastName: trimmed.lastName,
        username: trimmed.username,
        email: trimmed.email,
        role: formData.role,
        phone: trimmed.phone || undefined,
        city: trimmed.city || undefined,
        bio: trimmed.bio || undefined,
        address: trimmed.address || undefined,
        country: trimmed.country || undefined,
        category: formData.role === "professional" ? formData.category : undefined,
        subcategory: formData.role === "professional" ? formData.subcategory : undefined,
      };
      await register(registerData);
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <div
      style={{
        background: FORM_BG,
        padding: "40px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflowY: "auto",
      }}>

      {/* Title */}
      <div style={{marginBottom: 26}}>
        <p style={{color:LABEL, fontWeight:800, fontSize:12, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6}}>
          Únete a nabbi
        </p>
        <h1 style={{color: INK, fontWeight: 900, fontSize: 28, letterSpacing: "-0.03em", margin: 0}}>
          Crear Cuenta
        </h1>
        <p style={{color:"#64748b", fontSize:14, lineHeight:1.6, margin:"12px 0 0"}}>
          Igual que en mobile: crea tu cuenta con correo, luego entrarás con código.
        </p>
      </div>

      <form style={{display:"flex", flexDirection:"column", gap:14}} onSubmit={handleSubmit}>
        <div>
          <label style={{display:"block", color:DARK, fontSize:12, fontWeight:600, marginBottom:8}}>
            Tipo de cuenta
          </label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            {[
              {value:"client", label:"Cliente"},
              {value:"professional", label:"Profesional"},
            ].map((option) => (
              <label
                key={option.value}
                style={{
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  gap:8,
                  minHeight:46,
                  borderRadius:12,
                  border:`1.5px solid ${formData.role === option.value ? MAIN : "rgba(85,131,103,0.22)"}`,
                  background:formData.role === option.value ? "rgba(85,131,103,0.08)" : "white",
                  color:DARK,
                  fontSize:14,
                  fontWeight:700,
                  cursor:"pointer",
                }}>
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={formData.role === option.value}
                  onChange={handleInputChange}
                  style={{display:"none"}}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <Field label="Nombre" name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
          <Field label="Apellido" name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
        </div>

        <Field label="Nombre de usuario" name="username" placeholder="@usuario" value={formData.username} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tu@email.com" value={formData.email} onChange={handleInputChange} disabled={isLoading} icon={<IconEmail/>}/>
        <Field label="Dirección (opcional)" name="address" placeholder="Tu dirección" value={formData.address} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <Field label="Ciudad (opcional)" name="city" placeholder="Ciudad" value={formData.city} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
          <Field label="País (opcional)" name="country" placeholder="País" value={formData.country} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
        </div>

        {formData.role === "professional" && (
          <>
            <Field label="Teléfono (opcional)" name="phone" placeholder="+52 55 1234 5678" value={formData.phone} onChange={handleInputChange} disabled={isLoading} icon={<IconUser/>}/>
            <div>
              <label style={{display:"block", color:DARK, fontSize:12, fontWeight:600, marginBottom:6}}>
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isLoading}
                style={selectBase}>
                <option value="">Selecciona una categoría</option>
                {MAIN_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display:"block", color:DARK, fontSize:12, fontWeight:600, marginBottom:6}}>
                Subcategoría
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                disabled={isLoading || !formData.category}
                style={selectBase}>
                <option value="">Selecciona una subcategoría</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display:"block", color:DARK, fontSize:12, fontWeight:600, marginBottom:6}}>
                Bio (opcional)
              </label>
              <textarea
                name="bio"
                placeholder="Cuéntale a tus clientes qué haces"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={4}
                style={{
                  ...inputBase,
                  paddingRight: 14,
                  resize: "vertical",
                  minHeight: 104,
                }}
              />
            </div>
          </>
        )}

        <label style={{display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", color:DARK, fontSize:13, lineHeight:1.5}}>
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{marginTop:3}}
          />
          <span>
            Acepto los términos y condiciones de uso.
          </span>
        </label>

        {(localError || error) && (
          <div style={{background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:12, padding:"10px 14px"}}>
            <p style={{color:"#dc2626", fontSize:13, fontWeight:600, margin:0}}>{localError || error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            background: ACCENT,
            color: INK,
            borderRadius: 14,
            padding: "14px 0",
            fontWeight: 800,
            fontSize: 15,
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.65 : 1,
            transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
            boxShadow: `0 6px 20px rgba(246,197,49,0.35)`,
            marginTop: 6,
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(246,197,49,0.45)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(246,197,49,0.35)";
          }}>
          {isLoading ? (
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <svg style={{animation:"spin 1s linear infinite"}} width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(18,33,26,0.25)" strokeWidth="4"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill={INK}/>
              </svg>
              Creando cuenta…
            </span>
          ) : "Crear cuenta"}
        </button>

        <p style={{textAlign:"center", fontSize:13, color:"#64748b", margin:0}}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{color:MAIN, fontWeight:700, textDecoration:"none"}}>
            Inicia sesión
          </Link>
        </p>

      </form>
    </div>
  );
};
