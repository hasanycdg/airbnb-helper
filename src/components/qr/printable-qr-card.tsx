/**
 * PrintableQrCard
 *
 * A hidden-by-default component that becomes visible only in print media.
 * Import this in the QR page; it renders all codes as a print-friendly grid.
 * Use the global CSS class `print:block` (Tailwind) for visibility switching.
 */

import { QR_CODE_LABELS } from "@/lib/constants";
import type { QRCodeType } from "@prisma/client";

interface PrintableQrItem {
  id: string;
  type: QRCodeType;
  token: string;
  label: string | null;
  shortUrl: string;
  dataUrl: string;
}

interface PrintableQrCardProps {
  propertyName: string;
  items: PrintableQrItem[];
}

export function PrintableQrCard({ propertyName, items }: PrintableQrCardProps) {
  if (items.length === 0) return null;

  return (
    <div
      aria-hidden
      className="hidden print:block"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
          }
          .print-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 5mm;
            display: flex;
            align-items: center;
            gap: 5mm;
            page-break-inside: avoid;
          }
          .print-card img { width: 30mm; height: 30mm; flex-shrink: 0; }
          .print-card-body { flex: 1; min-width: 0; }
          .print-card-label { font-size: 10pt; font-weight: 600; margin-bottom: 1.5mm; }
          .print-card-type { font-size: 7pt; color: #64748b; margin-bottom: 2mm; }
          .print-card-url { font-size: 6.5pt; color: #64748b; word-break: break-all; }
          .print-header {
            margin-bottom: 6mm;
            padding-bottom: 3mm;
            border-bottom: 2px solid #0f172a;
          }
          .print-header h1 { font-size: 14pt; font-weight: 700; margin: 0 0 1mm; }
          .print-header p { font-size: 9pt; color: #64748b; margin: 0; }
        }
      `}</style>

      <div className="print-header">
        <h1>{propertyName}</h1>
        <p>QR code reference sheet</p>
      </div>

      <div className="print-grid">
        {items.map((item) => (
          <div key={item.id} className="print-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.dataUrl}
              alt={`QR code for ${item.label ?? QR_CODE_LABELS[item.type]}`}
            />
            <div className="print-card-body">
              <div className="print-card-label">
                {item.label ?? QR_CODE_LABELS[item.type]}
              </div>
              <div className="print-card-type">{QR_CODE_LABELS[item.type]}</div>
              <div className="print-card-url">{item.shortUrl}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
