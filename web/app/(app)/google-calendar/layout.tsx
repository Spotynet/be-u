import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Google Calendar",
};

export default function Layout({children}: {children: React.ReactNode}) {
  return children;
}
