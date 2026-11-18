import {SVGProps} from "react";

/** Apple logo mark — uses currentColor for light/dark. */
export function AppleIcon({className, ...props}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
      {...props}>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.03-.8.88-2.13 1.56-3.27 1.47-.14-1.1.43-2.24 1.16-3.05.8-.9 2.2-1.56 3.29-1.45zM20.74 17.4c-.55 1.26-.82 1.82-1.53 2.94-1 1.55-2.4 3.48-4.15 3.5-1.55.02-1.95-1.01-4.06-1-2.1.01-2.55 1.03-4.1 1.01-1.75-.02-3.08-1.76-4.08-3.3C.98 17.7-.5 12.5 1.4 9.05c1.08-1.95 2.79-3.18 4.42-3.18 1.65 0 2.68 1.07 4.05 1.07 1.33 0 2.14-1.08 4.05-1.08 1.45 0 2.98.99 4.05 2.7-3.55 1.95-2.98 7.05.77 8.84z" />
    </svg>
  );
}
