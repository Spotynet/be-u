"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  AcademicCapIcon,
  ArrowLongRightIcon,
  Bars3Icon,
  BellAlertIcon,
  BoltIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  StarIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useTheme} from "@/components/ThemeProvider";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch";
import {getCatIcon} from "@/components/icons/CategoryIcons";
import {
  ACCENT,
  ACCENT_RGB,
  CREAM,
  DARK,
  DARK_RGB,
  GOLD,
  GOLD_RGB,
  INK,
  LABEL,
  LIGHT,
  MAIN,
  MAIN_RGB,
  TEAL_RGB,
  getSurfaces,
  type Surfaces,
} from "@/constants/brand";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const CATEGORIES = [
  {
    id: "belleza",
    label: "Belleza",
    headline: "Para verte increíble",
    iconGrad: "linear-gradient(145deg,#fdf2f8 0%,#fce7f3 60%,#fbcfe8 100%)",
    color: "#fdf2f8",
    border: "rgba(236,72,153,0.2)",
    tagBg: "rgba(236,72,153,0.09)",
    tagColor: "#be185d",
    subs: ["Cabello", "Pestañas", "Cejas", "Maquillaje", "Manos y pies", "Faciales", "Barbería"],
  },
  {
    id: "bienestar",
    label: "Bienestar",
    headline: "Para sentirte de lujo",
    iconGrad: "linear-gradient(145deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)",
    color: "#f0fdf4",
    border: "rgba(34,197,94,0.2)",
    tagBg: "rgba(34,197,94,0.1)",
    tagColor: "#15803d",
    subs: ["Spa y masajes", "Yoga", "Meditación", "Pilates", "Breathwork", "Acupuntura", "Fisioterapia", "Psicoterapia", "Nutrición", "Holística"],
  },
  {
    id: "mascotas",
    label: "Mascotas",
    headline: "Para tus peludos favoritos",
    iconGrad: "linear-gradient(145deg,#fffbeb 0%,#fef3c7 60%,#fde68a 100%)",
    color: "#fffbeb",
    border: "rgba(245,158,11,0.2)",
    tagBg: "rgba(245,158,11,0.1)",
    tagColor: "#b45309",
    subs: ["Estética", "Spa", "Cuidadores", "Paseadores", "Guarderías"],
  },
];

const ALL_SUBS = CATEGORIES.flatMap((c) =>
  c.subs.map((s) => ({label: s, catId: c.id, color: c.tagColor, bg: c.tagBg}))
);

const FAQS = [
  {
    icon: QuestionMarkCircleIcon,
    q: "¿Cómo funciona esto exactamente?",
    a: "Tú nos dices qué necesitas: un corte, una clase de yoga o lo que sea. nabbi vigila las agendas de tus profesionales las 24 horas. Cuando hay un hueco, te reserva y te manda una notificación. Así de simple.",
  },
  {
    icon: Squares2X2Icon,
    q: "¿Qué servicios cubre nabbi?",
    a: "Belleza (cabello, pestañas, cejas, maquillaje, manos y pies, faciales, barbería), bienestar (spa, yoga, meditación, pilates, breathwork, acupuntura, fisioterapia, psicoterapia, nutrición, holística) y mascotas (estética, spa, cuidadores, paseadores, guarderías). Más de 22 tipos de servicio.",
  },
  {
    icon: RocketLaunchIcon,
    q: "¿Es gratis?",
    a: "Sí. Usar nabbi para encontrar y reservar citas es gratis para ti. Los profesionales y negocios tienen sus propios planes según lo que necesiten.",
  },
  {
    icon: BellAlertIcon,
    q: "¿Y si reserva algo que ya no quiero?",
    a: "No te preocupes. Siempre recibes una notificación antes de que se confirme. Puedes aprobar, cancelar o reprogramar desde la aplicación sin problema.",
  },
  {
    icon: HeartIcon,
    q: "¿Funciona para el baño de mi perro también?",
    a: "Sí. En mascotas tenemos estéticas, spas, cuidadores a domicilio, paseadores y guarderías.",
  },
  {
    icon: BriefcaseIcon,
    q: "Soy profesional o tengo un negocio, ¿puedo unirme?",
    a: "Claro. Entra a la aplicación, elige tu categoría (belleza, bienestar o mascotas), define tus servicios y empieza a recibir reservas.",
  },
  {
    icon: CalendarDaysIcon,
    q: "¿Con qué calendarios conecta?",
    a: "Con Google Calendar y Apple Calendar, para que tus citas lleguen directo a tu agenda. También conectamos con sistemas de clínicas y centros de bienestar.",
  },
  {
    icon: ShieldCheckIcon,
    q: "¿Mis datos están seguros?",
    a: "Todo está cifrado y no se comparte nada sin tu permiso. Puedes revisar nuestra política de privacidad cuando quieras: está escrita en lenguaje claro.",
  },
];

const NAV_LINKS = [
  {href: "#categorias", label: "Categorías", icon: Squares2X2Icon},
  {href: "#como-funciona", label: "Cómo funciona", icon: BoltIcon},
  {href: "#faq", label: "FAQ", icon: ChatBubbleLeftRightIcon},
] as const;

function NabbiIcon({size = 44}: {size?: number}) {
  const padding = size * 0.2;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: DARK,
        padding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
      <img src="/nabbi_logo_t.png" alt="" style={{width: "100%", height: "100%"}} />
    </div>
  );
}

function AppIcon({
  icon: Icon,
  size = 18,
  color = "currentColor",
}: {
  icon: HeroIcon;
  size?: number;
  color?: string;
}) {
  return <Icon style={{width: size, height: size, color, flexShrink: 0}} aria-hidden="true" />;
}

function IconChip({
  icon: Icon,
  size = 20,
  color,
  background,
}: {
  icon: HeroIcon;
  size?: number;
  color: string;
  background: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "999px",
        background,
        flexShrink: 0,
      }}>
      <Icon style={{width: size, height: size, color}} aria-hidden="true" />
    </span>
  );
}

function Wave({from, to}: {from: string; to: string}) {
  return (
    <div className="lp-wave" style={{background: to, lineHeight: 0, marginTop: -1}} aria-hidden="true">
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{display: "block", width: "100%"}}>
        <path d="M0,28 C200,56 400,4 600,28 C800,52 1000,4 1200,28 C1320,42 1390,38 1440,28 L1440,0 L0,0 Z" fill={from} />
      </svg>
    </div>
  );
}

function CtaButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  style,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "text" | "textLight";
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  const {theme} = useTheme();
  const s = getSurfaces(theme === "dark" ? "dark" : "light");

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: s.cta,
      color: s.ctaText,
      border: "1.5px solid transparent",
      boxShadow: `0 4px 16px rgba(${s.ctaRgb},0.35)`,
    },
    secondary: {
      background: "rgba(255,255,255,0.1)",
      color: "white",
      border: "1.5px solid rgba(255,255,255,0.22)",
      boxShadow: "none",
    },
    ghost: {
      background: s.card,
      color: s.text,
      border: `1.5px solid ${s.border}`,
      boxShadow: "none",
    },
    dark: {
      background: s.forestMid,
      color: s.mode === "dark" ? s.text : "#ffffff",
      border: "1.5px solid transparent",
      boxShadow: "none",
    },
    text: {
      background: "transparent",
      color: s.text,
      border: "1.5px solid transparent",
      boxShadow: "none",
      fontWeight: 600,
    },
    textLight: {
      background: "transparent",
      color: "rgba(255,255,255,0.92)",
      border: "1.5px solid transparent",
      boxShadow: "none",
      fontWeight: 600,
    },
  };

  const sizes: Record<string, CSSProperties> = {
    sm: {padding: "10px 18px", fontSize: 14, minHeight: 44},
    md: {padding: "14px 28px", fontSize: 15, minHeight: 48},
  };

  return (
    <button
      type={type}
      className={`lp-focus ${className}`}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        borderRadius: 999,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        transition: "opacity 0.15s, transform 0.15s",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1)";
      }}>
      {children}
    </button>
  );
}

/** Product mock — no floating badges over the hero visual */
function PhoneMockup() {
  const cats = [
    {id: "belleza", label: "Belleza", bg: "rgba(236,72,153,0.18)", border: "rgba(236,72,153,0.32)", color: "#f9a8d4"},
    {id: "bienestar", label: "Bienestar", bg: `rgba(${MAIN_RGB},0.2)`, border: `rgba(${MAIN_RGB},0.35)`, color: "#86efac"},
    {id: "mascotas", label: "Mascotas", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.32)", color: "#fde68a"},
  ];
  const monitoring = [
    {id: "bienestar", label: "Yoga, búsqueda activa", status: "Buscando...", statusColor: "rgba(255,255,255,0.45)", dot: "rgba(255,255,255,0.3)"},
    {id: "mascotas", label: "Baño, 2 opciones listas", status: "Listo para confirmar", statusColor: "#86efac", dot: "#22c55e"},
  ];
  const navIcons = [Squares2X2Icon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, UserGroupIcon];

  return (
    <div className="lp-phone-shell">
      <div
        style={{
          background: `linear-gradient(160deg,${INK} 0%,#1a221d 100%)`,
          borderRadius: "2.8rem",
          padding: 8,
          border: "2px solid rgba(255,255,255,0.11)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
        }}>
        <div style={{display: "flex", justifyContent: "center", marginBottom: 5}}>
          <div style={{width: 52, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.14)"}} />
        </div>

        <div style={{background: "#0d1710", borderRadius: "2.2rem", overflow: "hidden", display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px 5px", color: "rgba(255,255,255,0.4)", fontSize: 9.5}}>
            <span style={{fontWeight: 600}}>9:41</span>
            <div style={{width: 14, height: 7, border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 2, display: "flex", alignItems: "center", padding: 1}}>
              <div style={{width: "72%", height: "100%", background: ACCENT, borderRadius: 1}} />
            </div>
          </div>

          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 16px 10px"}}>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <NabbiIcon size={22} />
              <span style={{color: "white", fontWeight: 800, fontSize: 15, letterSpacing: "-0.03em"}}>nabbi</span>
            </div>
            <BellAlertIcon style={{width: 17, height: 17, color: "rgba(255,255,255,0.55)"}} aria-hidden="true" />
          </div>

          <div style={{padding: "0 16px 10px"}}>
            <p style={{color: "rgba(255,255,255,0.45)", fontSize: 9.5, margin: "0 0 2px", fontWeight: 500}}>Buenos días</p>
            <p style={{color: "white", fontWeight: 800, fontSize: 13.5, margin: "0 0 7px", letterSpacing: "-0.02em"}}>¿Qué necesitas hoy?</p>
            <div style={{display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", borderRadius: 999, padding: "3px 9px"}}>
              <div style={{width: 5, height: 5, borderRadius: "50%", background: "#22c55e"}} />
              <span style={{color: "#86efac", fontSize: 8.5, fontWeight: 700}}>nabbi vigilando, 3 activas</span>
            </div>
          </div>

          <div style={{display: "flex", gap: 5, padding: "0 12px 11px"}}>
            {cats.map((c) => (
              <div key={c.id} style={{flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "9px 4px 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4}}>
                <div style={{width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
                  {getCatIcon(c.id, 28)}
                </div>
                <span style={{color: c.color, fontSize: 7.5, fontWeight: 700, textAlign: "center", lineHeight: 1.2}}>{c.label}</span>
              </div>
            ))}
          </div>

          <div style={{height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px 10px"}} />

          <div style={{margin: "0 12px 9px", borderRadius: 14, background: `rgba(${MAIN_RGB},0.14)`, border: `1.5px solid rgba(${MAIN_RGB},0.42)`, padding: "10px 12px"}}>
            <div style={{display: "flex", alignItems: "center", gap: 5, marginBottom: 8}}>
              <div style={{width: 6, height: 6, borderRadius: "50%", background: "#22c55e"}} />
              <span style={{color: "#86efac", fontSize: 8.5, fontWeight: 800, letterSpacing: "0.05em"}}>Cita encontrada</span>
            </div>
            <div style={{display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 9}}>
              <div style={{width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0}}>
                {getCatIcon("belleza", 30)}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <p style={{color: "white", fontWeight: 800, fontSize: 11.5, margin: "0 0 1px"}}>Corte y color</p>
                <p style={{color: "rgba(255,255,255,0.55)", fontSize: 9, margin: "0 0 2px"}}>Lorena Pérez, 4.9</p>
                <span style={{color: ACCENT, fontSize: 8.5, fontWeight: 700}}>Hoy, 17:30, disponible</span>
              </div>
            </div>
            <div style={{width: "100%", borderRadius: 999, padding: "9px 0", background: ACCENT, color: INK, fontWeight: 800, fontSize: 10.5, textAlign: "center", letterSpacing: "0.01em"}}>
              Confirmar cita
            </div>
          </div>

          <div style={{padding: "0 12px 11px"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px"}}>Vigilando</p>
            {monitoring.map((item) => (
              <div key={item.id} style={{display: "flex", alignItems: "center", gap: 7, marginBottom: 7}}>
                <div style={{width: 24, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0}}>
                  {getCatIcon(item.id, 22)}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <p style={{color: "rgba(255,255,255,0.72)", fontSize: 9.5, fontWeight: 600, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{item.label}</p>
                  <div style={{display: "flex", alignItems: "center", gap: 3}}>
                    <div style={{width: 4, height: 4, borderRadius: "50%", background: item.dot, flexShrink: 0}} />
                    <span style={{fontSize: 8.5, color: item.statusColor, fontWeight: 500}}>{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 16px", borderTop: "1px solid rgba(255,255,255,0.07)"}}>
            {navIcons.map((Icon, i) => (
              <Icon key={i} style={{width: 17, height: 17, color: i === 0 ? ACCENT : "rgba(255,255,255,0.32)"}} aria-hidden="true" />
            ))}
          </div>
        </div>

        <div style={{display: "flex", justifyContent: "center", marginTop: 6}}>
          <div style={{width: 64, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)"}} />
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  icon: Icon,
  question,
  answer,
  isOpen,
  onToggle,
  s,
}: {
  icon: HeroIcon;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  s: Surfaces;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `1.5px solid ${isOpen ? `rgba(${s.primaryRgb},0.55)` : s.border}`,
        background: isOpen ? s.faqOpenBg : s.card,
        transition: "border-color 0.2s, background 0.2s",
        overflow: "hidden",
        boxShadow: isOpen ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
      }}>
      <button
        type="button"
        className="lp-focus"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          minHeight: 44,
        }}>
        <span style={{display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0}}>
          <IconChip icon={Icon} size={16} color={s.primary} background={`rgba(${s.primaryRgb},0.12)`} />
          <span style={{color: s.text, fontWeight: 700, fontSize: 14, lineHeight: 1.4, flex: 1}}>{question}</span>
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: isOpen ? s.cta : s.bgAlt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.2s, transform 0.2s",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}>
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <line x1="6.5" y1="1" x2="6.5" y2="12" stroke={isOpen ? s.ctaText : s.textMuted} strokeWidth="2" strokeLinecap="round" />
            <line x1="1" y1="6.5" x2="12" y2="6.5" stroke={isOpen ? s.ctaText : s.textMuted} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      <div style={{maxHeight: isOpen ? 720 : 0, overflow: "hidden", transition: "max-height 0.35s ease"}}>
        <p style={{color: s.textMuted, fontSize: 14, lineHeight: 1.7, padding: "0 16px 16px", margin: 0, fontWeight: 500}}>{answer}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const {isAuthenticated, isInitializing} = useAuth();
  const {theme} = useTheme();
  const surf = getSurfaces(theme === "dark" ? "dark" : "light");
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goAppHome = () => {
    const home =
      typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
        ? "/explore"
        : "/feed";
    router.push(home);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="lp-root" style={{minHeight: "100vh", fontFamily: "var(--font-nabbi), system-ui, sans-serif", background: surf.bg}}>
      <a
        href="#contenido"
        className="lp-focus"
        style={{
          position: "absolute",
          left: -9999,
          top: 8,
          zIndex: 100,
          background: ACCENT,
          color: INK,
          padding: "10px 16px",
          borderRadius: 999,
          fontWeight: 700,
          textDecoration: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "12px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}>
        Saltar al contenido
      </a>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header
        className="lp-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: surf.headerBg,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${surf.border}`,
        }}>
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          {/* Mobile: logo | actions — Desktop: equal columns so nav is truly centered */}
          <div className="lp-header-bar">
            <div className="lp-header-left">
              <Link href="/" style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0, textDecoration: "none"}} aria-label="nabbi inicio">
                <NabbiIcon size={28} />
                <span style={{fontWeight: 800, fontSize: 18, color: surf.text, letterSpacing: "-0.03em"}}>nabbi</span>
              </Link>
            </div>

            <nav className="lp-header-desktop-nav" aria-label="Principal">
              {NAV_LINKS.map(({href, label}) => (
                <a
                  key={href}
                  href={href}
                  className="lp-focus"
                  style={{color: surf.textMuted, fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 0", minHeight: 44, display: "inline-flex", alignItems: "center"}}
                  onMouseEnter={(e) => (e.currentTarget.style.color = surf.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = surf.textMuted)}>
                  {label}
                </a>
              ))}
            </nav>

            <div className="lp-header-right">
              <div className="lp-header-desktop-actions">
                {!isInitializing && isAuthenticated ? (
                  <CtaButton size="sm" onClick={goAppHome}>
                    Ir a la app
                  </CtaButton>
                ) : (
                  <>
                    <CtaButton size="sm" variant="text" onClick={() => router.push("/login")}>
                      Ingresar
                    </CtaButton>
                    <CtaButton size="sm" onClick={() => router.push("/register")}>
                      Empezar gratis
                    </CtaButton>
                  </>
                )}
              </div>

              <div className="lp-header-mobile-cta">
                {!isInitializing && isAuthenticated ? (
                  <CtaButton size="sm" onClick={goAppHome}>
                    Ir a la app
                  </CtaButton>
                ) : (
                  <CtaButton size="sm" onClick={() => router.push("/register")}>
                    Empezar
                  </CtaButton>
                )}
              </div>

              <div className="lp-header-theme-bar">
                <ThemeModeSwitch />
              </div>

              <button
                type="button"
                className="lp-burger lp-focus"
                onClick={() => setMobileMenuOpen((o) => !o)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  background: mobileMenuOpen ? surf.bgAlt : "transparent",
                  border: `1.5px solid ${mobileMenuOpen ? surf.cta : surf.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  padding: 10,
                  color: surf.text,
                  minWidth: 44,
                  minHeight: 44,
                }}
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <XMarkIcon style={{width: 20, height: 20}} aria-hidden="true" /> : <Bars3Icon style={{width: 20, height: 20}} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lp-mobile-drawer" style={{borderTop: `1px solid ${surf.border}`, background: surf.card, padding: "8px 0 24px", boxShadow: "0 12px 32px rgba(0,0,0,0.08)"}}>
            <div className="mx-auto w-full max-w-[1600px] px-4">
              <div style={{display: "flex", flexDirection: "column", gap: 2}}>
                {NAV_LINKS.map(({href, label, icon: Icon}) => (
                  <a
                    key={href}
                    href={href}
                    className="lp-focus"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: surf.text,
                      fontSize: 16,
                      fontWeight: 600,
                      textDecoration: "none",
                      padding: "14px 4px",
                      borderBottom: `1px solid ${surf.border}`,
                      minHeight: 48,
                    }}>
                    <AppIcon icon={Icon} size={18} color={MAIN} />
                    {label}
                    <ChevronRightIcon style={{marginLeft: "auto", width: 16, height: 16, color: surf.textMuted}} aria-hidden="true" />
                  </a>
                ))}
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px", borderBottom: `1px solid ${surf.border}`, minHeight: 52}}>
                  <span style={{color: surf.text, fontSize: 16, fontWeight: 600}}>Apariencia</span>
                  <ThemeModeSwitch />
                </div>
                <div style={{marginTop: 16, display: "flex", flexDirection: "column", gap: 8}}>
                  {!isInitializing && isAuthenticated ? (
                    <CtaButton fullWidth onClick={() => { goAppHome(); setMobileMenuOpen(false); }}>
                      Ir a la app
                    </CtaButton>
                  ) : (
                    <>
                      <CtaButton
                        fullWidth
                        onClick={() => {
                          router.push("/register");
                          setMobileMenuOpen(false);
                        }}>
                        Empezar gratis
                      </CtaButton>
                      <CtaButton
                        fullWidth
                        variant="ghost"
                        onClick={() => {
                          router.push("/login");
                          setMobileMenuOpen(false);
                        }}>
                        Ingresar
                      </CtaButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="contenido">
        {/* ── HERO — brand, one headline, one line, CTAs, product visual ── */}
        <section
          className="lp-hero"
          style={{background: `linear-gradient(150deg, ${surf.forest} 0%, ${surf.forestMid} 55%, ${surf.mode === "dark" ? "#15261c" : "#2d4030"} 100%)`}}
          aria-labelledby="hero-brand">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 70% 60% at 70% 40%, rgba(${surf.primaryRgb},0.22) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 15% 80%, rgba(${surf.tealRgb},0.14) 0%, transparent 55%)`,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8" style={{position: "relative"}}>
            <div className="lp-hero-grid">
              <div className="lp-hero-copy">
                <p
                  id="hero-brand"
                  className="lp-hero-brand"
                  style={{
                    color: surf.cta,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}>
                  nabbi
                </p>

                <h1 className="lp-h1" style={{color: "white", fontWeight: 800}}>
                  Deja de recargar{" "}
                  <span style={{color: surf.cta, fontStyle: "italic"}}>una y otra vez.</span>
                  <br />
                  Consigue tu cita.
                </h1>

                <p className="lp-hero-lead" style={{color: "rgba(255,255,255,0.82)", marginTop: 0}}>
                  Vigila agendas las 24 horas en belleza, bienestar y mascotas. Cuando hay un hueco, reserva y te avisa.
                </p>

                <div className="lp-cta-row">
                  {!isInitializing && isAuthenticated ? (
                    <CtaButton onClick={goAppHome}>
                      <AppIcon icon={RocketLaunchIcon} size={18} color={INK} />
                      Ir a la app
                    </CtaButton>
                  ) : (
                    <>
                      <CtaButton onClick={() => router.push("/register")}>
                        <AppIcon icon={RocketLaunchIcon} size={18} color={INK} />
                        Empezar gratis
                      </CtaButton>
                      <CtaButton
                        className="lp-hero-secondary"
                        variant="secondary"
                        onClick={() => router.push("/login")}>
                        Ya tengo cuenta
                      </CtaButton>
                    </>
                  )}
                </div>
              </div>

              <div className="lp-phone-col" aria-hidden="true">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Marquee — tablet+ only */}
        <div className="lp-marquee" style={{background: surf.primary, overflow: "hidden"}} aria-hidden="true">
          <div className="marquee-track">
            {[...ALL_SUBS, ...ALL_SUBS].map((item, i) => (
              <span key={i} style={{display: "inline-flex", alignItems: "center", gap: 6, padding: "0 18px", color: surf.bg, fontWeight: 700, fontSize: "clamp(12px,2vw,14px)", whiteSpace: "nowrap"}}>
                <span style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.15)", overflow: "hidden", flexShrink: 0}}>
                  {getCatIcon(item.catId, 16)}
                </span>
                {item.label}
                <span style={{color: surf.gold, opacity: 0.7, marginLeft: 3}}>|</span>
              </span>
            ))}
          </div>
        </div>

        <Wave from={surf.forestMid} to={surf.bg} />

        {/* ── CATEGORIES ───────────────────────────────────────── */}
        <section id="categorias" className="lp-section" style={{background: surf.bg}} aria-labelledby="cat-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lp-section-intro">
              <p style={{color: surf.label, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8}}>¿Qué necesitas hoy?</p>
              <h2 id="cat-heading" style={{color: surf.text, fontWeight: 800, fontSize: "clamp(1.55rem,4.2vw,2.75rem)", letterSpacing: "-0.04em", lineHeight: 1.12, marginBottom: 10}}>
                Belleza, bienestar y mascotas
              </h2>
              <p style={{color: surf.textBody, fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.55, margin: 0}}>
                Elige categoría. nabbi se encarga del resto.
              </p>
            </div>

            <div className="lp-cat-grid">
              {CATEGORIES.map((cat, idx) => (
                <article
                  key={cat.id}
                  id={cat.id}
                  className="lp-cat-card"
                  style={{
                    borderRadius: 22,
                    border: `1.5px solid ${cat.border}`,
                    overflow: "hidden",
                    background: cat.color,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    transition: "transform 0.22s, box-shadow 0.22s",
                  }}>
                  <div className="lp-cat-media" style={{background: cat.iconGrad, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <span style={{position: "absolute", top: 12, right: 14, fontWeight: 800, fontSize: 11, color: cat.tagColor, opacity: 0.4, letterSpacing: "0.08em"}}>0{idx + 1}</span>
                    <div style={{position: "relative", zIndex: 1}}>{getCatIcon(cat.id)}</div>
                  </div>
                  <div style={{padding: "16px 16px 18px", background: cat.color, flex: 1, display: "flex", flexDirection: "column", minHeight: 0}}>
                    <h3 style={{color: INK, fontWeight: 800, fontSize: "clamp(17px,2.5vw,21px)", margin: "0 0 2px", letterSpacing: "-0.02em"}}>{cat.label}</h3>
                    <p style={{color: cat.tagColor, fontSize: 12, margin: "0 0 10px", fontWeight: 700}}>{cat.headline}</p>
                    <div style={{height: 1, background: cat.border, margin: "0 0 10px", flexShrink: 0}} />
                    <div className="lp-cat-tags">
                      {cat.subs.map((sub, i) => (
                        <span
                          key={sub}
                          className={i >= 5 ? "lp-cat-tag-extra" : undefined}
                          style={{background: cat.tagBg, color: cat.tagColor, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, border: `1px solid ${cat.border}`, lineHeight: 1.3}}>
                          {sub}
                        </span>
                      ))}
                      {cat.subs.length > 5 && (
                        <span
                          className="lp-cat-tag-more"
                          style={{background: cat.tagBg, color: cat.tagColor, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 700, border: `1px solid ${cat.border}`, lineHeight: 1.3}}>
                          +{cat.subs.length - 5}
                        </span>
                      )}
                    </div>
                    <CtaButton fullWidth variant="ghost" size="sm" onClick={() => router.push("/register")} style={{marginTop: "auto"}}>
                      <span className="lp-cat-cta-short">Ver {cat.label}</span>
                      <span className="lp-cat-cta-full">Ver profesionales de {cat.label}</span>
                      <ArrowLongRightIcon style={{width: 16, height: 16}} aria-hidden="true" />
                    </CtaButton>
                  </div>
                </article>
              ))}
            </div>

            <div className="lp-soon-banner" style={{marginTop: 20, borderRadius: 18, border: `1.5px dashed ${surf.border}`, background: surf.mode === "dark" ? surf.elevated : `rgba(${surf.darkRgb},0.03)`, padding: "14px 16px"}}>
              <div style={{display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1}}>
                <IconChip icon={RocketLaunchIcon} size={18} color={INK} background={`rgba(${surf.ctaRgb},0.28)`} />
                <div style={{minWidth: 0}}>
                  <p style={{color: surf.text, fontWeight: 800, fontSize: 14, margin: "0 0 2px"}}>Más categorías pronto</p>
                  <p style={{color: surf.textBody, fontSize: 12, margin: 0, lineHeight: 1.4}}>Fitness, salud, educación y más.</p>
                </div>
              </div>
              <div className="lp-soon-tags">
                {[
                  {label: "Fitness", icon: BoltIcon},
                  {label: "Salud", icon: ShieldCheckIcon},
                  {label: "Educación", icon: AcademicCapIcon},
                ].map((tag) => (
                  <span key={tag.label} style={{display: "inline-flex", alignItems: "center", gap: 6, background: surf.mode === "dark" ? "rgba(136,184,154,0.12)" : `rgba(${surf.darkRgb},0.06)`, color: surf.textBody, borderRadius: 999, padding: "5px 13px", fontSize: 12, fontWeight: 600, border: `1px dashed ${surf.border}`}}>
                    <tag.icon style={{width: 14, height: 14}} aria-hidden="true" />
                    {tag.label}
                  </span>
                ))}
              </div>
              <span className="lp-soon-badge" style={{display: "inline-flex", alignItems: "center", gap: 6, background: ACCENT, color: INK, borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 800, flexShrink: 0, whiteSpace: "nowrap"}}>
                <ClockIcon style={{width: 13, height: 13}} aria-hidden="true" />
                Pronto
              </span>
            </div>
          </div>
        </section>

        <Wave from={surf.bg} to={surf.bgAlt} />

        {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
        <section id="como-funciona" className="lp-section" style={{background: surf.bgAlt}} aria-labelledby="how-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lp-section-intro">
              <p style={{color: surf.label, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center"}}>
                <BoltIcon style={{width: 14, height: 14}} aria-hidden="true" />
                En serio, es fácil
              </p>
              <h2 id="how-heading" style={{color: surf.text, fontWeight: 800, fontSize: "clamp(1.55rem,4.2vw,2.75rem)", letterSpacing: "-0.04em", lineHeight: 1.12, marginBottom: 10}}>
                3 pasos y ya tienes tu cita
              </h2>
              <p style={{color: surf.textBody, fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.55, margin: 0}}>
                Sin formularios raros. Sin llamadas eternas.
              </p>
            </div>

            <div className="lp-steps-grid">
              {[
                {step: "01", icon: MagnifyingGlassIcon, color: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.2)", title: "Dime qué necesitas", body: "Elige categoría, servicio, profesional y tus preferencias de horario."},
                {step: "02", icon: BellAlertIcon, color: `rgba(${TEAL_RGB},0.15)`, border: `rgba(${TEAL_RGB},0.35)`, title: "nabbi vigila por ti", body: "Monitorea agendas las 24 horas. Tú no tienes que hacer nada."},
                {step: "03", icon: CheckBadgeIcon, color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", title: "Tenemos cita", body: "Cuando hay hueco, nabbi reserva y te avisa. Solo tienes que aparecer."},
              ].map((step, i) => (
                <div key={step.step} className="lp-step">
                  {i < 2 && <div className="lp-step-connector" style={{position: "absolute", top: 36, left: "62%", width: "36%", borderTop: `2px dashed rgba(${surf.darkRgb},0.15)`}} aria-hidden="true" />}
                  <div className="lp-step-icon" style={{background: step.color, border: `1.5px solid ${step.border}`}}>
                    <step.icon style={{width: 22, height: 22, color: surf.text}} aria-hidden="true" />
                    <span style={{color: surf.text, fontWeight: 800, fontSize: 9, letterSpacing: "0.05em", opacity: 0.5}}>{step.step}</span>
                  </div>
                  <div>
                    <h3 style={{color: surf.text, fontWeight: 800, fontSize: 17, margin: "0 0 6px", letterSpacing: "-0.02em"}}>{step.title}</h3>
                    <p className="lp-step-body" style={{color: surf.textBody, fontSize: 14, lineHeight: 1.65, margin: 0}}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-cta-row lp-cta-row--center" style={{marginTop: 28}}>
              <CtaButton variant="dark" onClick={() => router.push("/register")}>
                <CheckCircleIcon style={{width: 18, height: 18}} aria-hidden="true" />
                Quiero empezar ya
              </CtaButton>
            </div>
          </div>
        </section>

        <Wave from={surf.bgAlt} to={surf.bg} />

        {/* ── PARA PROFESIONALES ───────────────────────────────── */}
        <section className="lp-section" style={{background: surf.bg}} aria-labelledby="pro-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div>
                <p style={{color: surf.label, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6}}>
                  <BriefcaseIcon style={{width: 14, height: 14}} aria-hidden="true" />
                  Para profesionales
                </p>
                <h2 id="pro-heading" style={{color: surf.text, fontWeight: 800, fontSize: "clamp(1.7rem,4vw,2.6rem)", letterSpacing: "-0.04em", lineHeight: 1.12, marginBottom: 14}}>
                  ¿Tienes un negocio?
                  <br />
                  nabbi llena tu agenda.
                </h2>
                <p style={{color: surf.textBody, fontSize: "clamp(15px,2vw,17px)", lineHeight: 1.7, marginBottom: 24}}>
                  Únete a profesionales de belleza, bienestar y mascotas que ya usan nabbi para tener la agenda llena, sin marketing complicado.
                </p>
                <ul style={{listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10}}>
                  {[
                    "Publicas tus servicios y nabbi te trae clientes",
                    "Defines tu disponibilidad y nabbi gestiona los horarios",
                    "Recibes reservas directas, sin llamadas eternas",
                    "Construyes reputación con reseñas verificadas",
                  ].map((item) => (
                    <li key={item} style={{display: "flex", alignItems: "flex-start", gap: 10}}>
                      <div style={{width: 20, height: 20, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2}}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2 6L5 9L10 3" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{color: surf.textBody, fontSize: "clamp(13px,1.8vw,15px)", lineHeight: 1.5}}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="lp-cta-row">
                  <CtaButton onClick={() => router.push("/register")}>
                    <BriefcaseIcon style={{width: 18, height: 18}} aria-hidden="true" />
                    Registrar mi negocio
                  </CtaButton>
                </div>
              </div>

              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="lp-pro-card"
                    style={{background: cat.color, border: `1.5px solid ${cat.border}`, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, transition: "transform 0.2s"}}>
                    <div style={{width: 46, height: 46, borderRadius: 13, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden"}}>
                      {getCatIcon(cat.id, 36)}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 8, flexWrap: "wrap"}}>
                        <span style={{color: INK, fontWeight: 800, fontSize: 15}}>{cat.label}</span>
                        <span style={{color: cat.tagColor, fontWeight: 700, fontSize: 11, background: cat.tagBg, borderRadius: 999, padding: "2px 9px", border: `1px solid ${cat.border}`, whiteSpace: "nowrap"}}>
                          {cat.subs.length} servicios
                        </span>
                      </div>
                      <div style={{display: "flex", flexWrap: "wrap", gap: 4}}>
                        {cat.subs.slice(0, 4).map((sub) => (
                          <span key={sub} style={{color: surf.textBody, fontSize: 11, fontWeight: 600}}>{sub}</span>
                        ))}
                        {cat.subs.length > 4 && <span style={{color: surf.textMuted, fontSize: 11}}>+{cat.subs.length - 4} más</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Wave from={surf.bg} to={surf.forestMid} />

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="lp-section" style={{background: surf.forestMid}} aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lp-section-intro">
              <p style={{color: surf.gold, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center"}}>
                <ChatBubbleLeftRightIcon style={{width: 14, height: 14}} aria-hidden="true" />
                Las dudas de siempre
              </p>
              <h2 id="faq-heading" style={{color: "white", fontWeight: 800, fontSize: "clamp(1.55rem,4.2vw,2.75rem)", letterSpacing: "-0.04em", lineHeight: 1.12, marginBottom: 10}}>
                Respuestas sin rodeos
              </h2>
              <p style={{color: "rgba(255,255,255,0.72)", fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.55, margin: 0}}>
                Si tienes otra pregunta, escríbenos.
              </p>
            </div>

            <div className="lp-faq-grid">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} icon={faq.icon} question={faq.q} answer={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} s={surf} />
              ))}
            </div>

            <div style={{textAlign: "center", marginTop: 40, padding: "24px 18px", background: `rgba(${surf.primaryRgb},0.12)`, borderRadius: 20, border: `1px solid rgba(${surf.primaryRgb},0.28)`}}>
              <p style={{color: "white", fontWeight: 800, fontSize: "clamp(15px,3vw,17px)", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap"}}>
                <QuestionMarkCircleIcon style={{width: 20, height: 20}} aria-hidden="true" />
                ¿Quedó alguna duda?
              </p>
              <p style={{color: "rgba(255,255,255,0.72)", fontSize: 14, marginBottom: 20}}>Escríbenos y te ayudamos.</p>
              <div className="lp-cta-row lp-cta-row--center">
                <CtaButton onClick={() => router.push("/contacto")}>
                  <EnvelopeIcon style={{width: 18, height: 18}} aria-hidden="true" />
                  Contactar soporte
                </CtaButton>
              </div>
            </div>
          </div>
        </section>

        {/* ── WEB ACCESS ───────────────────────────────────────── */}
        <section className="lp-section" style={{background: surf.bg}} aria-labelledby="web-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <p style={{color: surf.label, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6}}>
                  <DevicePhoneMobileIcon style={{width: 14, height: 14}} aria-hidden="true" />
                  Donde estés
                </p>
                <h2 id="web-heading" style={{color: surf.text, fontWeight: 800, fontSize: "clamp(1.7rem,4vw,2.6rem)", letterSpacing: "-0.04em", lineHeight: 1.12, marginBottom: 14}}>
                  nabbi en la web,
                  <br />
                  siempre contigo.
                </h2>
                <p style={{color: surf.textBody, fontSize: "clamp(15px,2vw,17px)", lineHeight: 1.7, marginBottom: 28}}>
                  Explora profesionales, reserva y gestiona tu agenda desde el navegador. Sin descargas. Las aplicaciones nativas llegan pronto.
                </p>
                <div className="lp-cta-row">
                  <CtaButton onClick={() => router.push("/register")}>Crear cuenta gratis</CtaButton>
                  <CtaButton variant="dark" onClick={() => router.push("/login")}>
                    Iniciar sesión
                  </CtaButton>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap"}}>
                  <div style={{display: "flex", gap: 2}} aria-hidden="true">
                    {Array.from({length: 5}).map((_, i) => (
                      <StarIcon key={i} style={{width: 16, height: 16, color: surf.gold}} />
                    ))}
                  </div>
                  <span style={{color: surf.textBody, fontSize: 13, fontWeight: 500}}>Regístrate ahora y sé de los primeros</span>
                </div>
              </div>

              <div style={{display: "flex", justifyContent: "center"}}>
                <div style={{position: "relative", width: "min(320px,85vw)"}}>
                  <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(${surf.goldRgb},0.28) 0%, rgba(${surf.primaryRgb},0.16) 50%, transparent 75%)`, borderRadius: 32, transform: "scale(1.12)", pointerEvents: "none"}} aria-hidden="true" />
                  <div style={{position: "relative", background: surf.forestMid, borderRadius: 32, padding: "28px 24px", boxShadow: `0 28px 64px rgba(${surf.darkRgb},0.32)`}}>
                    <div style={{display: "flex", alignItems: "center", gap: 14, marginBottom: 24}}>
                      <NabbiIcon size={40} />
                      <div>
                        <p style={{color: "white", fontWeight: 800, fontSize: 18, margin: 0, letterSpacing: "-0.03em"}}>nabbi</p>
                        <p style={{color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0}}>Tu agenda inteligente</p>
                      </div>
                    </div>
                    {[
                      {icon: CheckBadgeIcon, title: "Cita confirmada", sub: "Corte, mañana 11:00", color: `rgba(${surf.primaryRgb},0.22)`, border: `rgba(${MAIN_RGB},0.4)`, iconColor: "#bbf7d0"},
                      {icon: BellAlertIcon, title: "nabbi encontró un hueco", sub: "Masaje, hoy 17:30", color: `rgba(${GOLD_RGB},0.18)`, border: `rgba(${GOLD_RGB},0.35)`, iconColor: "#fcd34d"},
                      {icon: CheckCircleIcon, title: "Reserva en automático", sub: "Yoga, jueves 9:00", color: `rgba(${TEAL_RGB},0.18)`, border: `rgba(${TEAL_RGB},0.35)`, iconColor: "#99f6e4"},
                    ].map((n, i) => (
                      <div key={i} style={{borderRadius: 16, background: n.color, border: `1px solid ${n.border}`, padding: "12px 14px", marginBottom: i < 2 ? 10 : 0, display: "flex", alignItems: "center", gap: 12}}>
                        <span style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.08)", flexShrink: 0}}>
                          <n.icon style={{width: 20, height: 20, color: n.iconColor}} aria-hidden="true" />
                        </span>
                        <div style={{minWidth: 0}}>
                          <p style={{color: "white", fontWeight: 700, fontSize: 13, margin: "0 0 2px"}}>{n.title}</p>
                          <p style={{color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0}}>{n.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Wave from={surf.bg} to={surf.bgAlt} />

        {/* ── FINAL CTA ────────────────────────────────────────── */}
        <section className="lp-cta" style={{background: surf.bgAlt, position: "relative", overflow: "hidden"}} aria-labelledby="final-cta">
          <div style={{maxWidth: 520, margin: "0 auto", padding: "0 20px", textAlign: "center", position: "relative"}}>
            <div style={{display: "flex", justifyContent: "center", marginBottom: 14}}>
              <NabbiIcon size={44} />
            </div>
            <h2 id="final-cta" style={{color: surf.text, fontWeight: 800, fontSize: "clamp(1.65rem,5vw,3rem)", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12}}>
              Tu próxima cita
              <br />
              te está esperando
            </h2>
            <p style={{color: surf.textBody, fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 24px"}}>
              Dinos qué necesitas. nabbi lo consigue mientras tú haces tu vida.
            </p>
            <div className="lp-cta-row lp-cta-row--center">
              <CtaButton onClick={() => router.push("/register")}>
                <RocketLaunchIcon style={{width: 18, height: 18}} aria-hidden="true" />
                Empezar gratis
              </CtaButton>
              <CtaButton variant="ghost" onClick={() => router.push("/login")}>
                Ya tengo cuenta
              </CtaButton>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{background: surf.footerBg}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{paddingTop: 48, paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))"}}>
          <div className="lp-footer-grid" style={{marginBottom: 40}}>
            <div>
              <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 14}}>
                <NabbiIcon size={30} />
                <span style={{color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em"}}>nabbi</span>
              </div>
              <p style={{color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.75, marginBottom: 20}}>
                Belleza, bienestar y mascotas.
                <br />
                Tu cita, en automático.
              </p>
              <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
                {CATEGORIES.map((c) => (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    className="lp-focus"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 999,
                      padding: "8px 12px 8px 8px",
                      minHeight: 44,
                      border: "1px solid rgba(255,255,255,0.1)",
                      textDecoration: "none",
                    }}>
                    <span style={{display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", overflow: "hidden", alignItems: "center", justifyContent: "center"}}>
                      {getCatIcon(c.id, 18)}
                    </span>
                    {c.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em"}}>Categorías</h4>
              <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0}}>
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="lp-focus lp-footer-link" style={{color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, textDecoration: "none"}}>
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em"}}>Empresa</h4>
              <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0}}>
                {[
                  {label: "Privacidad", href: "/aviso-de-privacidad"},
                  {label: "Términos", href: "/terminos-y-condiciones"},
                  {label: "Contacto", href: "/contacto"},
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="lp-focus lp-footer-link" style={{color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, textDecoration: "none"}}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em"}}>Producto</h4>
              <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0}}>
                {[
                  {label: "Cómo funciona", href: "#como-funciona"},
                  {label: "FAQ", href: "#faq"},
                  {label: "Crear cuenta", href: "/register"},
                  {label: "Ingresar", href: "/login"},
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="lp-focus lp-footer-link" style={{color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, textDecoration: "none"}}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12}}>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", lineHeight: 1.5}}>
              <span>© 2026 nabbi, hecho con</span>
              <HeartIcon style={{width: 14, height: 14, color: surf.cta}} aria-hidden="true" />
              <span>para tu tiempo libre</span>
            </p>
            <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
              <Link href="/aviso-de-privacidad" className="lp-focus lp-footer-link" style={{color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none", paddingInline: 4}}>
                Privacidad
              </Link>
              <Link href="/terminos-y-condiciones" className="lp-focus lp-footer-link" style={{color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none", paddingInline: 4}}>
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
