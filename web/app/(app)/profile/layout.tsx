import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Mi perfil público",
};

export default function Layout({children}: {children: React.ReactNode}) {
  return children;
}
