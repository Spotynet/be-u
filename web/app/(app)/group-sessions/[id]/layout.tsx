import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Sesión grupal",
};

export default function Layout({children}: {children: React.ReactNode}) {
  return children;
}
