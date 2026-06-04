import QRCode from "qrcode";
import { env } from "@/lib/env";

export interface QrDesign {
  fg?: string;
  bg?: string;
}

/** Short, scan-tracked link for a QR token: /q/[token] → redirect + analytics. */
export function qrShortUrl(token: string): string {
  return `${env.appUrl}/q/${token}`;
}

export async function generateQrDataUrl(text: string, design?: QrDesign): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: design?.fg ?? "#0F172A",
      light: design?.bg ?? "#FFFFFF",
    },
  });
}

export async function generateQrSvg(text: string, design?: QrDesign): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: design?.fg ?? "#0F172A",
      light: design?.bg ?? "#FFFFFF",
    },
  });
}
