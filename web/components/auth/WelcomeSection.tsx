import {getCatIcon} from "@/components/icons/CategoryIcons";

// ─── Brand tokens (mirrors landing page) ────────────────────────────────────
const INK   = "#12211A";
const DARK  = "#1F3328";
const MAIN  = "#558367";
const ACCENT= "#F6C531";

interface WelcomeSectionProps {
  title: string;
  description: string;
}

export const WelcomeSection = ({description}: WelcomeSectionProps) => {
  return (
    <div
      style={{
        background: `linear-gradient(145deg, #243c2c 0%, ${DARK} 50%, ${INK} 100%)`,
        padding: "52px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 28,
        position: "relative",
        overflow: "hidden",
      }}>

      {/* Subtle decorative rings — sage green */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,height:400,borderRadius:"50%",border:`1.5px solid rgba(85,131,103,0.15)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:270,height:270,borderRadius:"50%",border:`1.5px solid rgba(85,131,103,0.1)`,pointerEvents:"none"}}/>
      {/* Accent blob top-right */}
      <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:ACCENT,opacity:0.06,filter:"blur(40px)",pointerEvents:"none"}}/>
      {/* MAIN blob bottom-left */}
      <div style={{position:"absolute",bottom:-30,left:-30,width:160,height:160,borderRadius:"50%",background:MAIN,opacity:0.1,filter:"blur(32px)",pointerEvents:"none"}}/>

      {/* Logo */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,position:"relative"}}>
        <div style={{
          background:"rgba(255,255,255,0.07)",
          borderRadius:22,
          padding:18,
          boxShadow:`0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(85,131,103,0.2)`,
        }}>
          <svg width="60" height="60" viewBox="0 0 80 80" fill="none">
            {/* Clock face */}
            <circle cx="33" cy="35" r="24" stroke={MAIN} strokeWidth="4.5" fill="none"/>
            <line x1="33" y1="35" x2="33" y2="19" stroke={MAIN} strokeWidth="4" strokeLinecap="round"/>
            <line x1="33" y1="35" x2="47" y2="35" stroke={MAIN} strokeWidth="4" strokeLinecap="round"/>
            {/* Calendar square — ACCENT yellow */}
            <rect x="43" y="43" width="34" height="34" rx="8" fill={ACCENT}/>
            {([49,57,65] as number[]).map((x) => ([49,57,65] as number[]).map((y) => (
              <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1.5" fill={INK}/>
            )))}
          </svg>
        </div>
        <span style={{color:"white",fontWeight:900,fontSize:40,letterSpacing:"-0.04em",lineHeight:1}}>
          nabbi
        </span>
      </div>

      {/* Text */}
      <div style={{position:"relative"}}>
        <p style={{color:ACCENT,fontWeight:800,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>
          Belleza · Bienestar · Mascotas
        </p>
        <p style={{color:"rgba(255,255,255,0.85)",fontSize:16,lineHeight:1.7,maxWidth:280,margin:"0 auto"}}>
          {description}
        </p>
      </div>

      {/* Category pills */}
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,position:"relative"}}>
        {[
          {id:"belleza",   label:"Belleza",   bg:"rgba(236,72,153,0.2)",  border:"rgba(236,72,153,0.45)"},
          {id:"bienestar", label:"Bienestar", bg:"rgba(85,131,103,0.22)", border:"rgba(85,131,103,0.45)"},
          {id:"mascotas",  label:"Mascotas",  bg:"rgba(245,158,11,0.2)",  border:"rgba(245,158,11,0.45)"},
        ].map(p => (
          <span
            key={p.label}
            style={{
              display:"inline-flex",
              alignItems:"center",
              gap:6,
              background:p.bg,
              border:`1px solid ${p.border}`,
              borderRadius:999,
              padding:"6px 14px 6px 5px",
              fontSize:12,
              fontWeight:700,
              color:"rgba(255,255,255,0.9)",
            }}>
            <span style={{
              display:"inline-flex",
              alignItems:"center",
              justifyContent:"center",
              background:"rgba(255,255,255,0.12)",
              borderRadius:"50%",
              width:26,
              height:26,
              overflow:"hidden",
              flexShrink:0,
            }}>
              {getCatIcon(p.id, 22)}
            </span>
            {p.label}
          </span>
        ))}
      </div>

      {/* Trust signals */}
      <div style={{position:"relative",display:"flex",flexDirection:"column",gap:7,marginTop:4}}>
        {["Sin llamadas ni esperas","Reserva automática 24/7","Gratis para usuarios"].map(feat => (
          <div key={feat} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:`rgba(85,131,103,0.25)`,border:`1px solid rgba(85,131,103,0.4)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={MAIN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:500}}>{feat}</span>
          </div>
        ))}
      </div>

    </div>
  );
};
