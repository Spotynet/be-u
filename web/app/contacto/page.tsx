import type {Metadata} from "next";
import Link from "next/link";
import {CONTACT_EMAIL, PRIVACY_POLICY_URL, TERMS_URL} from "@/constants/legal";

export const metadata: Metadata = {
  title: "Contacto | nabbi",
  description: "Contacta al equipo de nabbi para soporte, privacidad o consultas generales.",
};

const INK = "#12211A";
const MAIN = "#558367";

export default function ContactoPage() {
  return (
    <div
      style={{
        background: "var(--color-background, #FAF8F3)",
        color: "var(--color-foreground, #1F3328)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--color-border, #CCD8CE)",
          padding: "20px 0",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: INK,
              textDecoration: "none",
              letterSpacing: "-0.03em",
            }}
          >
            nabbi
          </Link>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: MAIN,
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main style={{maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px"}}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          Contacto
        </h1>
        <p style={{fontSize: 16, lineHeight: 1.8, marginBottom: 32}}>
          ¿Necesitas ayuda con la app, tu cuenta o una reserva? Escríbenos y te respondemos lo antes posible.
        </p>

        <section style={{display: "flex", flexDirection: "column", gap: 20, fontSize: 16, lineHeight: 1.8}}>
          <p>
            <strong>Soporte general:</strong>{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{color: MAIN, fontWeight: 700}}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <strong>Privacidad / derechos ARCO:</strong>{" "}
            <a href="mailto:privacidad@nabbi.app" style={{color: MAIN, fontWeight: 700}}>
              privacidad@nabbi.app
            </a>
          </p>
          <p>
            También puedes revisar nuestro{" "}
            <a href={PRIVACY_POLICY_URL} style={{color: MAIN, fontWeight: 700}}>
              Aviso de Privacidad
            </a>{" "}
            y los{" "}
            <a href={TERMS_URL} style={{color: MAIN, fontWeight: 700}}>
              Términos y Condiciones
            </a>
            .
          </p>
          <p style={{color: "var(--color-foreground-muted, #5A7D6A)", fontSize: 14}}>
            Spotynet S.A. de C.V. · Calle Orizaba 154, Roma Norte, Cuauhtémoc, 06700 CDMX · RFC SPO190614UJ5
          </p>
        </section>
      </main>
    </div>
  );
}
