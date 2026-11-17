import type {Metadata} from "next";
import {Poppins} from "next/font/google";
import "./globals.css";
import {ClientThemeProvider} from "@/components/ClientThemeProvider";
import {AuthProvider} from "@/features/auth/hooks/useAuth";

const poppins = Poppins({
  // --font-nabbi is canonical; --font-geist-sans kept as alias for older screens
  variable: "--font-nabbi",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "nabbi: tu cita, en automático",
    template: "%s | nabbi",
  },
  description:
    "Belleza, bienestar y mascotas. nabbi vigila las agendas por ti y reserva cuando hay hueco. Gratis para usuarios.",
  applicationName: "nabbi",
  icons: {
    icon: [
      {url: "/favicon.ico", sizes: "any"},
      {url: "/favicon-32.png", sizes: "32x32", type: "image/png"},
      {url: "/icon-192.png", sizes: "192x192", type: "image/png"},
      {url: "/icon-512.png", sizes: "512x512", type: "image/png"},
    ],
    apple: [{url: "/apple-icon.png", sizes: "180x180", type: "image/png"}],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <ClientThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
