import {cookies} from "next/headers";
import {
  SIDEBAR_COOKIE,
  parseSidebarCookieValue,
} from "@/components/shell/shell-config";
import {AppLayoutClient} from "./AppLayoutClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const raw = jar.get(SIDEBAR_COOKIE)?.value;
  const initialSidebarPinned = parseSidebarCookieValue(raw);

  return (
    <AppLayoutClient initialSidebarPinned={initialSidebarPinned}>
      {children}
    </AppLayoutClient>
  );
}
