"use client";

import {ReactNode} from "react";

interface AuthLayoutProps {
  children: ReactNode;
  /** Full-viewport edge-to-edge auth shell */
  wide?: boolean;
}

/**
 * Auth page chrome. When `wide`, children fill the viewport (no frame/card).
 */
export const AuthLayout = ({children, wide = false}: AuthLayoutProps) => {
  if (wide) {
    return <div className="auth-root auth-root--split">{children}</div>;
  }

  return (
    <div className="auth-root auth-root--card">
      <div className="auth-card">{children}</div>
    </div>
  );
};
