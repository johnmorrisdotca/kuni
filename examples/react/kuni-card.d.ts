import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "kuni-card": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { code?: string; fields?: string; size?: string; lang?: string; theme?: string };
    }
  }
}
