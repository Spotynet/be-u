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
  ScissorsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {getCatIcon} from "@/components/icons/CategoryIcons";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
// Main: #558367 (verde salvia) · Accent: #AE5238 (terracota) · Gold: #D39932 (ámbar)
// Teal: #225D65 (azul pizarra) · Light: #E3D8C6 (arena cálida)
const INK   = "#12211A";        // verde casi negro → footer
const DARK  = "#1F3328";        // bosque profundo → hero, secciones dark
const MAIN  = "#558367";        // verde salvia principal
const LIGHT = "#E3D8C6";        // arena cálida → secciones alternas
const CREAM = "#FAF8F3";        // blanco cálido → fondo de página
const ACCENT= "#F6C531";        // amarillo vibrante → CTAs, botones primarios
const GOLD  = "#D39932";        // ámbar/mostaza → stats, detalles elegantes
const TEAL  = "#225D65";        // azul pizarra → blob, notif. tarjeta, paso 02
const LABEL = "#3d6050";        // verde apagado → texto label
/** RGB helpers */
const MAIN_RGB  = "85, 131, 103";
const ACCENT_RGB= "246, 197, 49";
const DARK_RGB  = "31, 51, 40";
const GOLD_RGB  = "211, 153, 50";
const TEAL_RGB  = "34, 93, 101";


// ─── Categorías ───────────────────────────────────────────────────────────────
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
    subs: ["Cabello", "Pestañas", "Cejas", "Maquillaje", "Manos & Pies", "Faciales", "Barbería"],
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
    subs: ["Spa & Masajes", "Yoga", "Meditación", "Pilates", "Breathwork", "Acupuntura", "Fisioterapia", "Psicoterapia", "Nutrición", "Holística"],
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
  {icon: QuestionMarkCircleIcon, q:"¿Cómo funciona esto exactamente?",a:"Tú nos dices qué necesitas (un corte, una clase de yoga, lo que sea). nabbi vigila las agendas de tus profes 24/7. Cuando hay hueco, te reserva y te manda notificación. Así de simple."},
  {icon: Squares2X2Icon, q:"¿Qué servicios cubre nabbi?",a:"Belleza (Cabello, Pestañas, Cejas, Maquillaje, Manos & Pies, Faciales, Barbería), Bienestar (Spa, Yoga, Meditación, Pilates, Breathwork, Acupuntura, Fisioterapia, Psicoterapia, Nutrición, Holística) y Mascotas (Estética, Spa, Cuidadores, Paseadores, Guarderías). Más de 22 tipos de servicio."},
  {icon: RocketLaunchIcon, q:"¿Es gratis? No me hagas pagar nada raro",a:"Sí, usar nabbi para encontrar y reservar citas es completamente gratis para ti. Los profesionales y negocios tienen sus propios planes según lo que necesiten."},
  {icon: BellAlertIcon, q:"¿Y si reserva algo que ya no quiero?",a:"Tranqui. Siempre recibes una notificación antes de que se confirme todo. Puedes aprobar, cancelar o reprogramar desde la app sin drama."},
  {icon: HeartIcon, q:"¿Funciona para el baño de mi perro también?",a:"Claro. En Mascotas tenemos estéticas, spas, cuidadores a domicilio, paseadores y guarderías. Tu peludo también merece lo mejor."},
  {icon: BriefcaseIcon, q:"Soy profesional / tengo un negocio, ¿puedo unirme?",a:"Claro. Entra a la app, elige tu categoría (Belleza, Bienestar o Mascotas), define tus servicios y empieza a recibir reservas."},
  {icon: CalendarDaysIcon, q:"¿Con qué calendarios conecta?",a:"Con Google Calendar y Apple Calendar para que tus citas caigan directo en tu agenda. También conectamos con sistemas de clínicas y centros de bienestar."},
  {icon: ShieldCheckIcon, q:"¿Mis datos están seguros?",a:"Todo cifrado, nada compartido sin tu permiso. Puedes revisar nuestra política de privacidad cuando quieras; está en lenguaje humano, sin letras pequeñas raras."},
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function NabbiIcon({size = 44, variant = "color"}: {size?: number; variant?: "color" | "white"}) {
  const padding = size * 0.2;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "#1F3328",
        padding: padding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/nabbi_logo_t.png"
        alt="nabbi logo"
        style={{width: "100%", height: "100%"}}
      />
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
  return <Icon style={{width:size, height:size, color, flexShrink:0}} aria-hidden="true"/>;
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
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        width:size + 12,
        height:size + 12,
        borderRadius:"999px",
        background,
        flexShrink:0,
      }}
    >
      <Icon style={{width:size, height:size, color}} aria-hidden="true"/>
    </span>
  );
}

function Wave({from, to}: {from: string; to: string}) {
  return (
    <div style={{background: to, lineHeight: 0, marginTop: -1}}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{display:"block",width:"100%",height:"clamp(32px,4vw,56px)"}}>
        <path d="M0,28 C200,56 400,4 600,28 C800,52 1000,4 1200,28 C1320,42 1390,38 1440,28 L1440,0 L0,0 Z" fill={from}/>
      </svg>
    </div>
  );
}

function PhoneMockup() {
  const cats = [
    {id:"belleza",   label:"Belleza",   bg:"rgba(236,72,153,0.18)", border:"rgba(236,72,153,0.32)", color:"#f9a8d4"},
    {id:"bienestar", label:"Bienestar", bg:"rgba(85,131,103,0.2)",  border:"rgba(85,131,103,0.35)", color:"#86efac"},
    {id:"mascotas",  label:"Mascotas",  bg:"rgba(245,158,11,0.18)", border:"rgba(245,158,11,0.32)", color:"#fde68a"},
  ];
  const monitoring = [
    {id:"bienestar", label:"Yoga · búsqueda activa",    status:"buscando…",      statusColor:"rgba(255,255,255,0.45)", dot:"rgba(255,255,255,0.3)"},
    {id:"mascotas",  label:"Baño · 2 opciones listas",  status:"listo para confirmar",    statusColor:"#86efac",               dot:"#22c55e"},
  ];
  const navIcons = [Squares2X2Icon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, UserGroupIcon];

  return (
    <div style={{width:"min(290px,70vw)",margin:"0 auto",position:"relative"}}>

      {/* Floating bubble — cita encontrada (top-right) */}
      <div className="float-anim" style={{
        position:"absolute",top:-20,right:-16,zIndex:10,
        background:"white",borderRadius:16,padding:"10px 13px",
        boxShadow:"0 12px 36px rgba(0,0,0,0.22)",
        minWidth:150,border:`1.5px solid rgba(${MAIN_RGB},0.4)`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
          <span style={{color:DARK,fontWeight:800,fontSize:11}}>¡Cita conseguida!</span>
        </div>
        <p style={{margin:0,color:"#64748b",fontSize:9.5,lineHeight:1.4}}>Lorena P. · Hoy 17:30</p>
        <p style={{margin:"1px 0 0",color:MAIN,fontSize:9,fontWeight:700}}>Corte & Color · Belleza</p>
      </div>

      {/* Floating bubble — nabbi activo (bottom-left) */}
      <div className="float-slow" style={{
        position:"absolute",bottom:52,left:-22,zIndex:10,
        background:ACCENT,borderRadius:14,padding:"8px 12px",
        boxShadow:`0 8px 24px rgba(${ACCENT_RGB},0.45)`,
        border:"1.5px solid rgba(255,255,255,0.35)",
      }}>
          <p style={{margin:0,color:INK,fontWeight:800,fontSize:10,lineHeight:1.3,display:"flex",alignItems:"center",gap:5}}>
            <AppIcon icon={BoltIcon} size={12} color={INK}/>
            nabbi activo
          </p>
          <p style={{margin:"2px 0 0",color:"rgba(18,33,26,0.65)",fontSize:8.5}}>vigilando 24/7</p>
      </div>

      {/* Phone frame */}
      <div style={{
        background:`linear-gradient(160deg,${INK} 0%,#1a221d 100%)`,
        borderRadius:"2.8rem",
        padding:8,
        border:"2px solid rgba(255,255,255,0.11)",
        boxShadow:"0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
      }}>

        {/* Notch */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:5}}>
          <div style={{width:52,height:5,borderRadius:3,background:"rgba(255,255,255,0.14)"}}/>
        </div>

        {/* Screen */}
        <div style={{background:"#0d1710",borderRadius:"2.2rem",overflow:"hidden",display:"flex",flexDirection:"column"}}>

          {/* Status bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px 5px",color:"rgba(255,255,255,0.4)",fontSize:9.5}}>
            <span style={{fontWeight:600}}>9:41</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{display:"flex",alignItems:"flex-end",gap:"1.5px"}}>
                {[3,5,7].map(h=><div key={h} style={{width:2.5,height:h,borderRadius:1,background:"rgba(255,255,255,0.45)"}}/>)}
              </div>
              <div style={{width:14,height:7,border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:2,display:"flex",alignItems:"center",padding:"1px"}}>
                <div style={{width:"72%",height:"100%",background:ACCENT,borderRadius:1}}/>
              </div>
            </div>
          </div>

          {/* App header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 16px 10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <NabbiIcon size={22} variant="white"/>
              <span style={{color:"white",fontWeight:900,fontSize:15,letterSpacing:"-0.03em"}}>nabbi</span>
            </div>
            <div style={{position:"relative",padding:4}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <div style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:ACCENT,border:"1.5px solid #0d1710"}}/>
            </div>
          </div>

          {/* Greeting + live status */}
          <div style={{padding:"0 16px 10px"}}>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:9.5,margin:"0 0 2px",fontWeight:500}}>Buenos días</p>
            <p style={{color:"white",fontWeight:800,fontSize:13.5,margin:"0 0 7px",letterSpacing:"-0.02em"}}>¿Qué necesitas hoy?</p>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.28)",borderRadius:999,padding:"3px 9px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{color:"#86efac",fontSize:8.5,fontWeight:700}}>nabbi vigilando · 3 activas</span>
            </div>
          </div>

          {/* Category shortcuts */}
          <div style={{display:"flex",gap:5,padding:"0 12px 11px"}}>
            {cats.map(c=>(
              <div key={c.id} style={{flex:1,background:c.bg,border:`1px solid ${c.border}`,borderRadius:12,padding:"9px 4px 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:30,height:30,borderRadius:10,background:"rgba(255,255,255,0.09)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                  {getCatIcon(c.id, 28)}
                </div>
                <span style={{color:c.color,fontSize:7.5,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"0 12px 10px"}}/>

          {/* Cita encontrada card */}
          <div style={{margin:"0 12px",borderRadius:14,background:`rgba(${MAIN_RGB},0.14)`,border:`1.5px solid rgba(${MAIN_RGB},0.42)`,padding:"10px 12px",marginBottom:9}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{color:"#86efac",fontSize:8.5,fontWeight:800,letterSpacing:"0.05em"}}>¡NABBI ENCONTRÓ CITA!</span>
            </div>
            <div style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:9}}>
              <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                {getCatIcon("belleza", 30)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:"white",fontWeight:800,fontSize:11.5,margin:"0 0 1px"}}>Corte & Color</p>
                <p style={{color:"rgba(255,255,255,0.55)",fontSize:9,margin:"0 0 2px"}}>Lorena Pérez · ⭐ 4.9</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(246,197,49,0.15)",borderRadius:999,padding:"2px 7px"}}>
                  <span style={{color:ACCENT,fontSize:8.5,fontWeight:700}}>Hoy · 17:30 — disponible</span>
                </div>
              </div>
            </div>
            <button style={{width:"100%",borderRadius:999,padding:"9px 0",background:ACCENT,color:INK,fontWeight:800,fontSize:10.5,border:"none",cursor:"pointer",marginBottom:5,letterSpacing:"0.01em"}}>
              Confirmar cita
            </button>
            <button style={{width:"100%",borderRadius:999,padding:"6px 0",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",fontWeight:600,fontSize:9,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer"}}>
              Ver más opciones
            </button>
          </div>

          {/* Monitoring list */}
          <div style={{padding:"0 12px 11px"}}>
            <p style={{color:"rgba(255,255,255,0.3)",fontSize:8.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 8px"}}>Vigilando</p>
            {monitoring.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <div style={{width:24,height:24,borderRadius:8,background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                  {getCatIcon(item.id, 22)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:"rgba(255,255,255,0.72)",fontSize:9.5,fontWeight:600,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</p>
                  <div style={{display:"flex",alignItems:"center",gap:3}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:item.dot,flexShrink:0}}/>
                    <span style={{fontSize:8.5,color:item.statusColor,fontWeight:500}}>{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0 16px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
            {navIcons.map((Icon,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <Icon style={{width:17,height:17,color:i===0 ? ACCENT : "rgba(255,255,255,0.32)"}} aria-hidden="true"/>
                {i===0 && <div style={{width:4,height:4,borderRadius:"50%",background:ACCENT}}/>}
              </div>
            ))}
          </div>

        </div>

        {/* Home indicator */}
        <div style={{display:"flex",justifyContent:"center",marginTop:6}}>
          <div style={{width:64,height:3,borderRadius:2,background:"rgba(255,255,255,0.18)"}}/>
        </div>
      </div>
    </div>
  );
}

/** FAQ abierto: fondo opaco (no rgba translúcido) para que el texto no se mezcle con el section oscuro detrás */
const FAQ_OPEN_BG = "#eef5f1";

function FaqItem({icon: Icon, question, answer, isOpen, onToggle}:{icon: HeroIcon; question:string;answer:string;isOpen:boolean;onToggle:()=>void}) {
  return (
    <div style={{borderRadius:20,border:`1.5px solid ${isOpen?`rgba(${MAIN_RGB},0.55)`:LIGHT}`,background:isOpen?FAQ_OPEN_BG:"#ffffff",transition:"border-color 0.2s,background 0.2s",overflow:"hidden",boxShadow:isOpen?"0 8px 24px rgba(0,0,0,0.12)":"none"}}>
      <button onClick={onToggle} style={{width:"100%",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,padding:"18px 20px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{display:"flex",alignItems:"flex-start",gap:10,flex:1}}>
          <IconChip icon={Icon} size={16} color={MAIN} background={`rgba(${MAIN_RGB},0.12)`}/>
          <span style={{color:DARK,fontWeight:700,fontSize:14,lineHeight:1.45,flex:1}}>{question}</span>
        </span>
        <div style={{width:28,height:28,borderRadius:"50%",background:isOpen?ACCENT:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s,transform 0.2s",transform:isOpen?"rotate(45deg)":"rotate(0deg)"}}>
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
            <line x1="6.5" y1="1" x2="6.5" y2="12" stroke={isOpen?"#fff":"#64748b"} strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="6.5" x2="12" y2="6.5" stroke={isOpen?"#fff":"#64748b"} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      <div style={{maxHeight:isOpen?400:0,overflow:"hidden",transition:"max-height 0.35s ease"}}>
        <p style={{color: LABEL,fontSize:14,lineHeight:1.8,padding:"0 20px 20px",margin:0,fontWeight:500}}>{answer}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const {isAuthenticated, isLoading} = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{minHeight:"100vh",fontFamily:"var(--font-geist-sans)",background:CREAM}}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header style={{position:"sticky",top:0,zIndex:50,background:"rgba(250,249,245,0.97)",backdropFilter:"blur(16px)",borderBottom:`1px solid rgba(${MAIN_RGB},0.35)`,boxShadow:`0 1px 12px rgba(${DARK_RGB},0.06)`}}>
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:64,gap:12}}>

            {/* Logo */}
            <Link href="/" style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,textDecoration:"none"}}>
              <NabbiIcon size={32} variant="color"/>
              <span style={{fontWeight:900,fontSize:19,color:DARK,letterSpacing:"-0.03em"}}>nabbi</span>
            </Link>

            {/* Desktop nav — center */}
            <nav className="hidden md:flex items-center gap-6" style={{flex:1,justifyContent:"center"}}>
              {[["#categorias","Categorías"],["#como-funciona","Cómo funciona"],["#faq","FAQ"]].map(([href,label])=>(
                <a key={href} href={href}
                  style={{color:"#4b5563",fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s",padding:"4px 0"}}
                  onMouseEnter={e=>(e.currentTarget.style.color=DARK)}
                  onMouseLeave={e=>(e.currentTarget.style.color="#4b5563")}>{label}</a>
              ))}
            </nav>

            {/* Right actions */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {/* "Entrar" — desktop only */}
              <button className="hidden md:block" onClick={()=>router.push("/login")}
                style={{color:"#4b5563",fontSize:14,fontWeight:600,background:"none",border:`1.5px solid rgba(${DARK_RGB},0.15)`,borderRadius:999,cursor:"pointer",padding:"8px 18px",transition:"border-color 0.15s,color 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color=DARK;e.currentTarget.style.borderColor=`rgba(${DARK_RGB},0.4)`;}}
                onMouseLeave={e=>{e.currentTarget.style.color="#4b5563";e.currentTarget.style.borderColor=`rgba(${DARK_RGB},0.15)`;}}>
                Entrar
              </button>

              {/* CTA — always visible, shorter on mobile */}
              <button onClick={()=>router.push("/register")}
                style={{background:ACCENT,color:INK,borderRadius:999,fontWeight:800,border:"none",cursor:"pointer",transition:"opacity 0.15s,transform 0.15s",whiteSpace:"nowrap",padding:"9px 20px",fontSize:14,boxShadow:`0 2px 14px rgba(${ACCENT_RGB},0.4)`}}
                onMouseEnter={e=>{e.currentTarget.style.opacity="0.85";e.currentTarget.style.transform="scale(1.04)";}}
                onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}>
                <span className="hidden sm:inline-flex items-center gap-2">
                  <AppIcon icon={RocketLaunchIcon} size={16} color={INK}/>
                  Empezar gratis
                </span>
                <span className="inline-flex items-center gap-1.5 sm:hidden">
                  <AppIcon icon={RocketLaunchIcon} size={14} color={INK}/>
                  Gratis
                </span>
              </button>

              {/* Hamburger — mobile only */}
              <button className="md:hidden" onClick={()=>setMobileMenuOpen(o=>!o)}
                style={{display:"flex",alignItems:"center",justifyContent:"center",background:mobileMenuOpen?LIGHT:"none",border:`1.5px solid ${mobileMenuOpen?ACCENT:`rgba(${DARK_RGB},0.15)`}`,borderRadius:10,cursor:"pointer",padding:7,color:DARK,flexShrink:0,transition:"background 0.15s,border-color 0.15s"}}
                aria-label="Menú">
                {mobileMenuOpen
                  ? <XMarkIcon style={{width:20,height:20}} aria-hidden="true"/>
                  : <Bars3Icon style={{width:20,height:20}} aria-hidden="true"/>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown — slides in below header */}
        {mobileMenuOpen && (
          <div style={{borderTop:`1px solid ${LIGHT}`,background:"white",padding:"8px 0 20px",boxShadow:"0 12px 32px rgba(0,0,0,0.08)"}}>
            <div className="mx-auto w-full max-w-[1600px] px-4">
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {[
                  {href:"#categorias", icon:Squares2X2Icon, label:"Categorías"},
                  {href:"#como-funciona", icon:BoltIcon, label:"Cómo funciona"},
                  {href:"#faq", icon:ChatBubbleLeftRightIcon, label:"Preguntas frecuentes"},
                ].map(({href, icon: Icon, label})=>(
                  <a key={href} href={href} onClick={()=>setMobileMenuOpen(false)}
                    style={{display:"flex",alignItems:"center",gap:12,color:DARK,fontSize:16,fontWeight:600,textDecoration:"none",padding:"14px 4px",borderBottom:`1px solid ${LIGHT}`}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28}}>
                      <AppIcon icon={Icon} size={18} color={MAIN}/>
                    </span>
                    {label}
                    <ChevronRightIcon style={{marginLeft:"auto",width:16,height:16,color:"#94a3b8"}} aria-hidden="true"/>
                  </a>
                ))}
                <div style={{display:"flex",gap:8,marginTop:14}}>
                  <button onClick={()=>{router.push("/login");setMobileMenuOpen(false);}}
                    style={{flex:1,borderRadius:12,padding:"12px 0",fontWeight:700,fontSize:15,background:"white",color:DARK,border:`1.5px solid rgba(${DARK_RGB},0.2)`,cursor:"pointer"}}>
                    Iniciar sesión
                  </button>
                  <button onClick={()=>{router.push("/register");setMobileMenuOpen(false);}}
                    style={{flex:1,borderRadius:12,padding:"12px 0",fontWeight:800,fontSize:15,background:ACCENT,color:INK,border:"none",cursor:"pointer",boxShadow:`0 4px 14px rgba(${ACCENT_RGB},0.4)`}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                      <AppIcon icon={RocketLaunchIcon} size={16} color={INK}/>
                      Empezar gratis
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="lp-hero" style={{background:`linear-gradient(150deg, ${INK} 0%, ${DARK} 50%, #2d4030 100%)`}}>
          {/* Decorative blobs */}
          <div style={{position:"absolute",top:"-15%",right:"-8%",width:"min(500px,80vw)",height:"min(500px,80vw)",borderRadius:"50%",background:MAIN,opacity:0.18,filter:"blur(40px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:"5%",left:"-10%",width:"min(320px,60vw)",height:"min(320px,60vw)",borderRadius:"50%",background:TEAL,opacity:0.12,filter:"blur(30px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:"30%",right:"15%",width:"min(180px,30vw)",height:"min(180px,30vw)",borderRadius:"50%",background:GOLD,opacity:0.09,filter:"blur(24px)",pointerEvents:"none"}}/>

          {/* Floating icons — desktop only */}
          <div className="float-anim hidden lg:flex" style={{position:"absolute",top:"15%",left:"5%",width:60,height:60,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"rgba(255,255,255,0.06)",opacity:0.8}}>
            <ScissorsIcon style={{width:30,height:30,color:"rgba(255,255,255,0.45)"}} aria-hidden="true"/>
          </div>
          <div className="float-slow hidden lg:flex" style={{position:"absolute",top:"60%",left:"8%",width:52,height:52,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"rgba(255,255,255,0.05)",opacity:0.8}}>
            <HeartIcon style={{width:24,height:24,color:"rgba(255,255,255,0.4)"}} aria-hidden="true"/>
          </div>
          <div className="float-anim hidden lg:flex" style={{position:"absolute",top:"25%",right:"5%",width:54,height:54,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"rgba(255,255,255,0.05)",opacity:0.8}}>
            <SparklesIcon style={{width:26,height:26,color:"rgba(255,255,255,0.4)"}} aria-hidden="true"/>
          </div>
          <div className="float-slow hidden lg:flex" style={{position:"absolute",top:"70%",right:"8%",width:48,height:48,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"rgba(255,255,255,0.05)",opacity:0.8}}>
            <BellAlertIcon style={{width:22,height:22,color:"rgba(255,255,255,0.4)"}} aria-hidden="true"/>
          </div>

          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8" style={{position:"relative"}}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

              {/* Text */}
              <div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`rgba(${GOLD_RGB},0.15)`,border:`1px solid rgba(${GOLD_RGB},0.4)`,borderRadius:999,padding:"6px 14px",marginBottom:20,color:GOLD,fontSize:12,fontWeight:700}}>
                  <SparklesIcon style={{width:15,height:15,color:GOLD}} aria-hidden="true"/>
                  <span>Belleza · Bienestar · Mascotas</span>
                </div>

                <h1 className="lp-h1" style={{color:"white",fontWeight:900,marginBottom:18,letterSpacing:"-0.04em",lineHeight:1.06}}>
                  Deja de hacer{" "}
                  <span style={{color:ACCENT,fontStyle:"italic"}}>refresh.</span>
                  <br/>
                  nabbi consigue tu cita.
                </h1>

                <p style={{color:"rgba(255,255,255,0.88)",fontSize:"clamp(15px,2.5vw,18px)",lineHeight:1.7,maxWidth:460,marginBottom:10}}>
                  Tu tiempo vale más que eso. nabbi vigila las agendas por ti las 24 horas — cuando hay hueco, reserva y te avisa.
                </p>
                <p style={{color:"rgba(255,255,255,0.68)",fontSize:14,lineHeight:1.6,maxWidth:420,marginBottom:28}}>
                  Cabello, yoga, masajes, paseadores, faciales… lo que necesites, sin tener que llamar mil veces.
                </p>

                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:32}}>
                  <button onClick={()=>router.push("/register")}
                    style={{background:ACCENT,color:INK,borderRadius:999,padding:"14px 28px",fontWeight:900,fontSize:"clamp(14px,2vw,16px)",border:"none",cursor:"pointer",boxShadow:`0 8px 24px rgba(${ACCENT_RGB},0.45)`,transition:"transform 0.15s,box-shadow 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow=`0 12px 32px rgba(${ACCENT_RGB},0.5)`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(${ACCENT_RGB},0.4)`;}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                      <AppIcon icon={RocketLaunchIcon} size={18} color={INK}/>
                      Empezar gratis
                    </span>
                  </button>
                  <button onClick={()=>router.push("/login")}
                    style={{background:"rgba(255,255,255,0.09)",color:"white",borderRadius:999,padding:"14px 24px",fontWeight:700,fontSize:"clamp(13px,2vw,15px)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",transition:"background 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.16)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.09)")}>
                    Ya tengo cuenta
                  </button>
                </div>

                {/* Mini stats */}
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  {[{v:"22+",l:"servicios cubiertos"},{v:"24/7",l:"vigilancia automática"},{v:"0€",l:"para el usuario"}].map(s=>(
                    <div key={s.l}>
                      <p style={{color:GOLD,fontWeight:900,fontSize:22,margin:0,letterSpacing:"-0.04em"}}>{s.v}</p>
                      <p style={{color:"rgba(255,255,255,0.68)",fontSize:11,margin:0,fontWeight:500}}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone — hidden on very small screens */}
              <div className="lp-phone-col">
                <PhoneMockup/>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ──────────────────────────────────────────── */}
        <div style={{background:MAIN,overflow:"hidden",padding:"11px 0",borderTop:`3px solid ${DARK}`,borderBottom:`3px solid ${DARK}`}}>
          <div className="marquee-track">
            {[...ALL_SUBS,...ALL_SUBS].map((s,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 18px",color:CREAM,fontWeight:700,fontSize:"clamp(12px,2vw,14px)",whiteSpace:"nowrap"}}>
                <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.15)",overflow:"hidden",flexShrink:0}}>
                  {getCatIcon(s.catId, 16)}
                </span>
                {s.label}<span style={{color:GOLD,opacity:0.7,marginLeft:3}}>•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Wave: dark → white */}
        <Wave from={DARK} to={CREAM}/>

        {/* ── CATEGORIES ───────────────────────────────────────── */}
        <section id="categorias" className="lp-section" style={{background:CREAM}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{textAlign:"center",marginBottom:"clamp(32px,5vw,52px)" as CSSProperties["marginBottom"]}}>
              <p style={{color:LABEL,fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>¿Qué necesitas hoy?</p>
              <h2 style={{color:DARK,fontWeight:900,fontSize:"clamp(1.7rem,4.5vw,3rem)",letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:14}}>
                Desde uñas y yoga hasta<br/>spa para tu mascota, lo tenemos todo.
              </h2>
              <p style={{color:"#475569",fontSize:"clamp(15px,2vw,17px)",maxWidth:480,margin:"0 auto 16px"}}>
                Escoge tu categoría. nabbi se encarga del resto — sin llamadas, sin esperas, sin refreshes.
              </p>
              {/* "Más próximamente" badge */}
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`rgba(${DARK_RGB},0.06)`,border:`1.5px dashed rgba(${DARK_RGB},0.2)`,borderRadius:999,padding:"7px 18px"}}>
                <SparklesIcon style={{width:16,height:16,color:MAIN}} aria-hidden="true"/>
                <span style={{color:DARK,fontSize:13,fontWeight:700}}>Belleza, Bienestar y Mascotas disponibles ahora</span>
                <span style={{background:ACCENT,color:INK,fontSize:11,fontWeight:800,borderRadius:999,padding:"2px 10px",letterSpacing:"0.02em"}}>+más muy pronto</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{marginTop:32}}>
              {CATEGORIES.map((cat,idx)=>(
                <div key={cat.id}
                  style={{borderRadius:24,border:`2px solid ${cat.border}`,overflow:"hidden",transition:"transform 0.22s,box-shadow 0.22s",cursor:"default",background:"white"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-6px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 28px 64px rgba(0,0,0,0.1)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>

                  {/* ── Icon hero area ── */}
                  <div style={{background:cat.iconGrad,height:172,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {/* Decorative blobs */}
                    <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:cat.border,opacity:0.3,pointerEvents:"none"}}/>
                    <div style={{position:"absolute",bottom:-18,left:-18,width:80,height:80,borderRadius:"50%",background:cat.tagBg,opacity:0.55,pointerEvents:"none"}}/>
                    <div style={{position:"absolute",top:16,left:18,width:22,height:22,borderRadius:"50%",background:cat.border,opacity:0.2,pointerEvents:"none"}}/>
                    {/* Index badge */}
                    <span style={{position:"absolute",top:14,right:18,fontWeight:900,fontSize:12,color:cat.tagColor,opacity:0.5,letterSpacing:"0.08em",fontFamily:"monospace"}}>0{idx+1}</span>
                    {/* SVG icon */}
                    <div style={{position:"relative",zIndex:1,filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.12))"}}>
                      {getCatIcon(cat.id)}
                    </div>
                  </div>

                  {/* ── Card content ── */}
                  <div style={{padding:"20px 22px 22px",background:cat.color}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <h3 style={{color:DARK,fontWeight:900,fontSize:21,margin:"0 0 3px",letterSpacing:"-0.02em"}}>{cat.label}</h3>
                        <p style={{color:cat.tagColor,fontSize:12,margin:0,fontWeight:700,letterSpacing:"0.02em"}}>{cat.headline}</p>
                      </div>
                      <span style={{flexShrink:0,lineHeight:1}}>{getCatIcon(cat.id, 28)}</span>
                    </div>
                    <div style={{height:1,background:cat.border,margin:"12px 0"}}/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
                      {cat.subs.map(sub=>(
                        <span key={sub} style={{background:cat.tagBg,color:cat.tagColor,borderRadius:999,padding:"4px 11px",fontSize:12,fontWeight:600,border:`1px solid ${cat.border}`}}>{sub}</span>
                      ))}
                    </div>
                    <button onClick={()=>router.push("/register")}
                      style={{width:"100%",borderRadius:999,padding:"10px 0",background:"white",color:DARK,fontWeight:700,fontSize:13,border:`1.5px solid ${cat.border}`,cursor:"pointer",transition:"background 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.background=cat.color)}
                      onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                        Ver profesionales de {cat.label}
                        <ArrowLongRightIcon style={{width:16,height:16}} aria-hidden="true"/>
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming soon banner */}
            <div style={{marginTop:28,borderRadius:20,border:`2px dashed rgba(${DARK_RGB},0.15)`,background:`rgba(${DARK_RGB},0.03)`,padding:"22px 28px",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <IconChip icon={RocketLaunchIcon} size={24} color={INK} background={`rgba(${ACCENT_RGB},0.28)`}/>
                <div>
                  <p style={{color:DARK,fontWeight:800,fontSize:15,margin:"0 0 3px"}}>Esto es solo el comienzo</p>
                  <p style={{color:"#475569",fontSize:13,margin:0}}>Pronto llegamos a más categorías: fitness, salud, educación y mucho más.</p>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {[
                  {label:"Fitness", icon: BoltIcon},
                  {label:"Salud", icon: ShieldCheckIcon},
                  {label:"Educación", icon: AcademicCapIcon},
                  {label:"Nutricionistas", icon: SparklesIcon},
                ].map(tag=>(
                  <span key={tag.label} style={{display:"inline-flex",alignItems:"center",gap:6,background:`rgba(${DARK_RGB},0.06)`,color:"#475569",borderRadius:999,padding:"5px 13px",fontSize:12,fontWeight:600,border:`1px dashed rgba(${DARK_RGB},0.15)`}}>
                    <tag.icon style={{width:14,height:14}} aria-hidden="true"/>
                    {tag.label}
                  </span>
                ))}
                <span style={{display:"inline-flex",alignItems:"center",gap:6,background:ACCENT,color:INK,borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:800}}>
                  <ClockIcon style={{width:14,height:14}} aria-hidden="true"/>
                  Próximamente
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Wave: cream → light */}
        <Wave from={CREAM} to={LIGHT}/>

        {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
        <section id="como-funciona" className="lp-section" style={{background:LIGHT}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{textAlign:"center",marginBottom:"clamp(36px,5vw,56px)" as CSSProperties["marginBottom"]}}>
              <p style={{color:LABEL,fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,display:"inline-flex",alignItems:"center",gap:6}}>
                <BoltIcon style={{width:14,height:14}} aria-hidden="true"/>
                En serio, es fácil
              </p>
              <h2 style={{color:DARK,fontWeight:900,fontSize:"clamp(1.7rem,4.5vw,3rem)",letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:14}}>
                3 pasos y ya tienes tu cita
              </h2>
              <p style={{color:"#475569",fontSize:"clamp(15px,2vw,17px)",maxWidth:400,margin:"0 auto"}}>
                Sin formularios raros. Sin llamadas eternas. Sin refreshes manuales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {step:"01",icon: MagnifyingGlassIcon,color:"rgba(236,72,153,0.12)",border:"rgba(236,72,153,0.2)",title:"Dime qué necesitas",body:"Elige tu categoría: Belleza, Bienestar o Mascotas. Selecciona el servicio, el profesional y tus preferencias de horario."},
                {step:"02",icon: BellAlertIcon,color:`rgba(${TEAL_RGB},0.15)`,border:`rgba(${TEAL_RGB},0.35)`,title:"nabbi vigila por ti",body:"nabbi monitorea las agendas las 24 horas, todos los días. Tú no tienes que hacer nada. En serio. Nada."},
                {step:"03",icon: CheckBadgeIcon,color:"rgba(245,158,11,0.12)",border:"rgba(245,158,11,0.25)",title:"Tenemos cita",body:"En cuanto hay un hueco disponible, nabbi reserva y te manda notificación al momento. Solo tienes que aparecer."},
              ].map((s,i)=>(
                <div key={s.step} style={{position:"relative",textAlign:"center"}}>
                  {i<2 && <div className="hidden md:block" style={{position:"absolute",top:36,left:"62%",width:"36%",borderTop:`2px dashed rgba(${DARK_RGB},0.15)`}}/>}
                  <div style={{width:68,height:68,borderRadius:20,background:s.color,border:`2px solid ${s.border}`,display:"inline-flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
                    <s.icon style={{width:26,height:26,color:DARK}} aria-hidden="true"/>
                    <span style={{color:DARK,fontWeight:900,fontSize:9,letterSpacing:"0.05em",opacity:0.5}}>{s.step}</span>
                  </div>
                  <h3 style={{color:DARK,fontWeight:800,fontSize:18,marginBottom:8,letterSpacing:"-0.02em"}}>{s.title}</h3>
                  <p className="lp-step-body" style={{color:"#475569",fontSize:14,lineHeight:1.7}}>{s.body}</p>
                </div>
              ))}
            </div>

            <div style={{textAlign:"center",marginTop:44}}>
              <button onClick={()=>router.push("/register")}
                style={{background:DARK,color:"white",borderRadius:999,padding:"14px 30px",fontWeight:800,fontSize:15,border:"none",cursor:"pointer",transition:"opacity 0.15s,transform 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.opacity="0.85";e.currentTarget.style.transform="scale(1.04)";}}
                onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                  <CheckCircleIcon style={{width:18,height:18}} aria-hidden="true"/>
                  Quiero empezar ya
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Wave: light → white */}
        <Wave from={LIGHT} to={CREAM}/>

        {/* ── PARA PROFESIONALES ───────────────────────────────── */}
        <section className="lp-section" style={{background:CREAM}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

              {/* Left */}
              <div>
                <p style={{color:LABEL,fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,display:"inline-flex",alignItems:"center",gap:6}}>
                  <BriefcaseIcon style={{width:14,height:14}} aria-hidden="true"/>
                  Para profesionales
                </p>
                <h2 style={{color:DARK,fontWeight:900,fontSize:"clamp(1.7rem,4vw,2.8rem)",letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:14}}>
                  ¿Tienes un negocio?<br/>nabbi llena tu agenda.
                </h2>
                <p style={{color:"#475569",fontSize:"clamp(15px,2vw,17px)",lineHeight:1.7,marginBottom:24}}>
                  Únete a profesionales de Belleza, Bienestar y Mascotas que ya usan nabbi para tener su agenda siempre llena — sin marketing complicado ni nada raro.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
                  {[
                    "Publicas tus servicios → nabbi te trae clientes",
                    "Defines tu disponibilidad → nabbi gestiona los horarios",
                    "Recibes reservas directas → sin llamadas eternas",
                    "Construyes reputación → con reseñas verificadas de verdad",
                    "Estadísticas de tu negocio → claras y sin complicaciones",
                  ].map(item=>(
                    <div key={item} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{color:"#334155",fontSize:"clamp(13px,1.8vw,15px)",lineHeight:1.5}}>{item}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>router.push("/register")}
                  style={{background:ACCENT,color:INK,borderRadius:999,padding:"14px 28px",fontWeight:800,fontSize:15,border:"none",cursor:"pointer",transition:"opacity 0.15s,transform 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="0.85";e.currentTarget.style.transform="scale(1.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                    <BriefcaseIcon style={{width:18,height:18}} aria-hidden="true"/>
                    Registrar mi negocio
                  </span>
                </button>
              </div>

              {/* Right: category cards */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {CATEGORIES.map(cat=>(
                  <div key={cat.id} className="lp-pro-card"
                    style={{background:cat.color,border:`1.5px solid ${cat.border}`,borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,transition:"transform 0.2s"}}
                    onMouseEnter={e=>(e.currentTarget.style.transform="translateX(5px)")}
                    onMouseLeave={e=>(e.currentTarget.style.transform="translateX(0)")}>
                    <div style={{width:46,height:46,borderRadius:13,background:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
                      {getCatIcon(cat.id, 36)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <span style={{color:DARK,fontWeight:800,fontSize:15}}>{cat.label}</span>
                        <span style={{color:cat.tagColor,fontWeight:700,fontSize:11,background:cat.tagBg,borderRadius:999,padding:"2px 9px",border:`1px solid ${cat.border}`,whiteSpace:"nowrap",flexShrink:0}}>{cat.subs.length} servicios</span>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {cat.subs.slice(0,4).map(s=>(
                          <span key={s} style={{color:"#475569",fontSize:11,fontWeight:600}}>{s}</span>
                        ))}
                        {cat.subs.length>4 && <span style={{color:"#64748b",fontSize:11,fontWeight:500}}>+{cat.subs.length-4} más</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Wave: white → dark */}
        <Wave from={CREAM} to={DARK}/>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="lp-section" style={{background:DARK}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{textAlign:"center",marginBottom:"clamp(32px,5vw,52px)" as CSSProperties["marginBottom"]}}>
              <p style={{color:GOLD,fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,display:"inline-flex",alignItems:"center",gap:6}}>
                <ChatBubbleLeftRightIcon style={{width:14,height:14}} aria-hidden="true"/>
                Las dudas de siempre
              </p>
              <h2 style={{color:"white",fontWeight:900,fontSize:"clamp(1.7rem,4.5vw,3rem)",letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:14}}>
                Respuestas sin rodeos
              </h2>
              <p style={{color:"rgba(255,255,255,0.78)",fontSize:"clamp(15px,2vw,17px)",maxWidth:400,margin:"0 auto"}}>
                Si tienes alguna duda más, escríbenos. Respondemos rápido, prometido.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAQS.map((faq,i)=>(
                <FaqItem key={i} icon={faq.icon} question={faq.q} answer={faq.a}
                  isOpen={openFaq===i} onToggle={()=>setOpenFaq(openFaq===i?null:i)}/>
              ))}
            </div>

            <div style={{textAlign:"center",marginTop:40,padding:"28px 20px",background:`rgba(${MAIN_RGB},0.12)`,borderRadius:20,border:`1px solid rgba(${MAIN_RGB},0.28)`}}>
              <p style={{color:"white",fontWeight:800,fontSize:17,marginBottom:8,display:"inline-flex",alignItems:"center",gap:8}}>
                <QuestionMarkCircleIcon style={{width:20,height:20}} aria-hidden="true"/>
                ¿Quedó alguna duda?
              </p>
              <p style={{color:"rgba(255,255,255,0.72)",fontSize:14,marginBottom:20}}>Escríbenos y te respondemos antes de que termines de buscar en Google.</p>
              <button onClick={()=>router.push("/register")}
                style={{background:ACCENT,color:INK,borderRadius:999,padding:"12px 26px",fontWeight:800,fontSize:14,border:"none",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                  <EnvelopeIcon style={{width:18,height:18}} aria-hidden="true"/>
                  Contactar soporte
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── DESCARGA LA APP ──────────────────────────────────── */}
        <section className="lp-section" style={{background:CREAM}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Text */}
              <div>
                <p style={{color:LABEL,fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,display:"inline-flex",alignItems:"center",gap:6}}>
                  <DevicePhoneMobileIcon style={{width:14,height:14}} aria-hidden="true"/>
                  Llévanos en el bolsillo
                </p>
                <h2 style={{color:DARK,fontWeight:900,fontSize:"clamp(1.7rem,4vw,2.8rem)",letterSpacing:"-0.04em",lineHeight:1.1,marginBottom:14}}>
                  nabbi en tu móvil,<br/>siempre contigo.
                </h2>
                <p style={{color:"#475569",fontSize:"clamp(15px,2vw,17px)",lineHeight:1.7,marginBottom:32}}>
                  Recibe notificaciones al instante, gestiona tus citas desde cualquier lugar y deja que nabbi trabaje mientras tú haces tu vida.
                </p>

                {/* Store buttons */}
                <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
                  {/* App Store */}
                  <a href="#" aria-label="Descargar en App Store"
                    style={{display:"inline-flex",alignItems:"center",gap:12,background:DARK,color:"white",borderRadius:16,padding:"13px 22px",textDecoration:"none",transition:"opacity 0.15s,transform 0.15s",boxShadow:`0 4px 16px rgba(${DARK_RGB},0.28)`}}
                    onMouseEnter={e=>{e.currentTarget.style.opacity="0.88";e.currentTarget.style.transform="scale(1.03)";}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}>
                    {/* Apple logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
                    </svg>
                    <div>
                      <p style={{margin:0,fontSize:10,fontWeight:500,opacity:0.7,letterSpacing:"0.02em"}}>Disponible en</p>
                      <p style={{margin:0,fontSize:16,fontWeight:800,letterSpacing:"-0.01em"}}>App Store</p>
                    </div>
                  </a>

                  {/* Google Play */}
                  <a href="#" aria-label="Descargar en Google Play"
                    style={{display:"inline-flex",alignItems:"center",gap:12,background:DARK,color:"white",borderRadius:16,padding:"13px 22px",textDecoration:"none",transition:"opacity 0.15s,transform 0.15s",boxShadow:`0 4px 16px rgba(${DARK_RGB},0.28)`}}
                    onMouseEnter={e=>{e.currentTarget.style.opacity="0.88";e.currentTarget.style.transform="scale(1.03)";}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)";}}>
                    {/* Play Store logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3.18 23.76c.31.17.67.19 1.01.06l11.37-6.57-2.5-2.5-9.88 9.01z" fill="#EA4335"/>
                      <path d="M20.47 10.6L17.6 8.97l-2.8 2.8 2.8 2.8 2.9-1.68c.83-.48.83-1.82-.03-2.29z" fill="#FBBC04"/>
                      <path d="M3.18.24C2.83.1 2.44.14 2.13.36L13.3 11.77l2.5-2.5L4.19.18c-.33-.12-.68-.1-1.01.06z" fill="#4285F4"/>
                      <path d="M2.13.36A1.5 1.5 0 001.5 1.5v21c0 .46.24.88.63 1.14l11.17-11.87L2.13.36z" fill="#34A853"/>
                    </svg>
                    <div>
                      <p style={{margin:0,fontSize:10,fontWeight:500,opacity:0.7,letterSpacing:"0.02em"}}>Disponible en</p>
                      <p style={{margin:0,fontSize:16,fontWeight:800,letterSpacing:"-0.01em"}}>Google Play</p>
                    </div>
                  </a>
                </div>

                {/* Social proof */}
                <div style={{display:"flex",alignItems:"center",gap:16,marginTop:24,flexWrap:"wrap"}}>
                  <div style={{display:"flex",gap:2}}>
                    {Array.from({length:5}).map((_,i)=>(
                      <StarIcon key={i} style={{width:16,height:16,color:GOLD}} aria-hidden="true"/>
                    ))}
                  </div>
                  <span style={{color:"#475569",fontSize:13,fontWeight:500}}>Próximamente en tiendas · ¡Regístrate ya y sé el primero!</span>
                </div>
              </div>

              {/* Visual: device mockup panel */}
              <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
                <div style={{position:"relative",width:"min(320px,85vw)"}}>
                  {/* Glow */}
                  <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 50%, rgba(${GOLD_RGB},0.35) 0%, rgba(${MAIN_RGB},0.2) 50%, transparent 75%)`,borderRadius:32,transform:"scale(1.15)",pointerEvents:"none"}}/>

                  {/* Main card */}
                  <div style={{position:"relative",background:DARK,borderRadius:32,padding:"28px 24px",boxShadow:`0 32px 72px rgba(${DARK_RGB},0.38), 0 0 0 1px rgba(255,255,255,0.08)`}}>
                    {/* App icon row */}
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
                      <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${MAIN},${DARK})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px rgba(${MAIN_RGB},0.5)`}}>
                        <NabbiIcon size={34} variant="color"/>
                      </div>
                      <div>
                        <p style={{color:"white",fontWeight:900,fontSize:18,margin:0,letterSpacing:"-0.03em"}}>nabbi</p>
                        <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,margin:0}}>Tu agenda inteligente</p>
                      </div>
                      <div style={{marginLeft:"auto",background:GOLD,color:INK,borderRadius:10,padding:"6px 16px",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                        Obtener
                      </div>
                    </div>

                    {/* Notification cards */}
                    {[
                      {icon:CheckBadgeIcon,title:"Cita confirmada",sub:"Corte · Mañana 11:00 AM",color:`rgba(${MAIN_RGB},0.22)`,border:`rgba(${MAIN_RGB},0.4)`,iconColor:"#bbf7d0"},
                      {icon:BellAlertIcon,title:"nabbi encontró un hueco",sub:"Masaje · Hoy 17:30 · disponible",color:`rgba(${GOLD_RGB},0.18)`,border:`rgba(${GOLD_RGB},0.35)`,iconColor:"#fcd34d"},
                      {icon:CheckCircleIcon,title:"Reserva en automático",sub:"Yoga · Jueves 9:00 AM · listo",color:`rgba(${TEAL_RGB},0.18)`,border:`rgba(${TEAL_RGB},0.35)`,iconColor:"#99f6e4"},
                    ].map((n,i)=>(
                      <div key={i} style={{borderRadius:16,background:n.color,border:`1px solid ${n.border}`,padding:"12px 14px",marginBottom:i<2?10:0,display:"flex",alignItems:"center",gap:12}}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:12,background:"rgba(255,255,255,0.08)",flexShrink:0}}>
                          <n.icon style={{width:20,height:20,color:n.iconColor}} aria-hidden="true"/>
                        </span>
                        <div style={{minWidth:0}}>
                          <p style={{color:"white",fontWeight:700,fontSize:13,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.title}</p>
                          <p style={{color:"rgba(255,255,255,0.55)",fontSize:11,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Wave: cream → light */}
        <Wave from={CREAM} to={LIGHT}/>

        {/* ── FINAL CTA ────────────────────────────────────────── */}
        <section className="lp-cta" style={{background:LIGHT,position:"relative",overflow:"hidden"}}>
          {[480,300,160].map(d=>(
            <div key={d} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:d,height:d,borderRadius:"50%",border:`2px solid ${GOLD}`,opacity:0.22,pointerEvents:"none"}}/>
          ))}

          <div style={{maxWidth:680,margin:"0 auto",padding:"0 20px",textAlign:"center",position:"relative"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
              <NabbiIcon size={50} variant="color"/>
            </div>
            <h2 style={{color:DARK,fontWeight:900,fontSize:"clamp(1.8rem,5vw,3.5rem)",letterSpacing:"-0.04em",lineHeight:1.08,marginBottom:14}}>
              Tu próxima cita ya<br/>te está esperando
            </h2>
            <p style={{color:"#475569",fontSize:"clamp(15px,2vw,17px)",lineHeight:1.65,maxWidth:460,margin:"0 auto 30px"}}>
              Belleza, bienestar o mascotas — dinos qué necesitas y nabbi lo consigue mientras tú haces tu vida.
            </p>

            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
              <button onClick={()=>router.push("/register")}
                style={{background:ACCENT,color:INK,borderRadius:999,padding:"15px 30px",fontWeight:900,fontSize:"clamp(14px,2vw,16px)",border:"none",cursor:"pointer",boxShadow:`0 8px 24px rgba(${ACCENT_RGB},0.45)`,transition:"transform 0.15s,box-shadow 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow=`0 12px 32px rgba(${ACCENT_RGB},0.5)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(${ACCENT_RGB},0.4)`;}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
                  <RocketLaunchIcon style={{width:18,height:18}} aria-hidden="true"/>
                  Empezar gratis
                </span>
              </button>
              <button onClick={()=>router.push("/login")}
                style={{background:"white",color:DARK,borderRadius:999,padding:"15px 28px",fontWeight:700,fontSize:"clamp(13px,2vw,15px)",border:`1.5px solid rgba(${DARK_RGB},0.15)`,cursor:"pointer",transition:"background 0.15s"}}
                onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
                onMouseLeave={e=>(e.currentTarget.style.background="white")}>
                Ya tengo cuenta
              </button>
            </div>

            <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
              {[
                {label:"Cabello", icon: ScissorsIcon},
                {label:"Yoga", icon: SparklesIcon},
                {label:"Spa", icon: HeartIcon},
                {label:"Paseadores", icon: UserGroupIcon},
                {label:"Faciales", icon: SparklesIcon},
                {label:"Pilates", icon: BoltIcon},
                {label:"Nutrición", icon: ShieldCheckIcon},
                {label:"Barbería", icon: ScissorsIcon},
                {label:"Estética", icon: HeartIcon},
                {label:"Breathwork", icon: SparklesIcon},
              ].map(tag=>(
                <span key={tag.label} style={{display:"inline-flex",alignItems:"center",gap:6,background:`rgba(${DARK_RGB},0.07)`,color:DARK,borderRadius:999,padding:"5px 12px",fontSize:12,fontWeight:600}}>
                  <tag.icon style={{width:14,height:14}} aria-hidden="true"/>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{background:INK}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{paddingTop:56,paddingBottom:40}}>

          {/* Top grid */}
          <div className="lp-footer-grid" style={{marginBottom:44}}>

            {/* Brand column */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <NabbiIcon size={30} variant="white"/>
                <span style={{color:"white",fontWeight:900,fontSize:20,letterSpacing:"-0.03em"}}>nabbi</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.65)",fontSize:13,lineHeight:1.75,marginBottom:20}}>
                Belleza, bienestar y mascotas.<br/>Tu cita, en automático.
              </p>
              {/* Category pills */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {CATEGORIES.map(c=>(
                  <span key={c.id} style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,borderRadius:999,padding:"4px 10px 4px 4px",border:"1px solid rgba(255,255,255,0.1)"}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,0.08)",overflow:"hidden",flexShrink:0}}>
                      {getCatIcon(c.id, 18)}
                    </span>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Categorías */}
            <div>
              <h4 style={{color:"rgba(255,255,255,0.4)",fontWeight:700,fontSize:11,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.08em"}}>Categorías</h4>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:10}}>
                {CATEGORIES.map(c=>(
                  <li key={c.id}>
                    <a href={`#${c.id}`}
                      style={{color:"rgba(255,255,255,0.65)",fontSize:14,fontWeight:500,textDecoration:"none",display:"flex",alignItems:"center",gap:8,transition:"color 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)}
                      onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.65)")}>
                      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.08)",overflow:"hidden",flexShrink:0}}>
                        {getCatIcon(c.id, 20)}
                      </span>
                      {c.label}
                    </a>
                  </li>
                ))}
                <li>
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:13,fontStyle:"italic"}}>+ más próximamente…</span>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 style={{color:"rgba(255,255,255,0.4)",fontWeight:700,fontSize:11,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.08em"}}>Empresa</h4>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:10}}>
                {["About","Blog","Privacidad","Términos"].map(link=>(
                  <li key={link}>
                    <a href="#"
                      style={{color:"rgba(255,255,255,0.65)",fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)}
                      onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.65)")}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 style={{color:"rgba(255,255,255,0.4)",fontWeight:700,fontSize:11,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.08em"}}>Soporte</h4>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:10}}>
                {["Contacto","FAQ","Comunidad","Estado"].map(link=>(
                  <li key={link}>
                    <a href="#"
                      style={{color:"rgba(255,255,255,0.65)",fontSize:14,fontWeight:500,textDecoration:"none",transition:"color 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.color=ACCENT)}
                      onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.65)")}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
            <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:20,display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:12}}>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,margin:0,display:"inline-flex",alignItems:"center",gap:6}}>
              <span>© 2026 nabbi · hecho con</span>
              <HeartIcon style={{width:14,height:14,color:ACCENT}} aria-hidden="true"/>
              <span>para tu tiempo libre</span>
            </p>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              {["Privacidad","Términos"].map(l=>(
                <a key={l} href="#" style={{color:"rgba(255,255,255,0.4)",fontSize:12,textDecoration:"none",transition:"color 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")}
                  onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.4)")}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
