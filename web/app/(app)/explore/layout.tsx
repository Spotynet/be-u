import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Explorar",
};

export default function Layout({children}: {children: React.ReactNode}) {
  return children;
}
