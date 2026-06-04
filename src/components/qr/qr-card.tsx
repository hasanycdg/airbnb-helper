"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Download,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
  ScanLine,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import {
  updateQrLabelAction,
  regenerateQrCodeAction,
  deleteQrCodeAction,
} from "@/server/qrcodes";
import { QR_CODE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { QRCodeType } from "@prisma/client";

export interface QrCardData {
  id: string;
  type: QRCodeType;
  token: string;
  label: string | null;
  targetPath: string;
  scanCount: number;
  shortUrl: string;
  dataUrl: string;
  svgContent: string;
}

interface QrCardProps {
  qr: QrCardData;
  propertyId: string;
}

export function QrCard({ qr, propertyId }: QrCardProps) {
  const { toast } = useToast();

  // ── Label edit state ────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState(qr.label ?? "");

  const [labelState, labelDispatch] = useActionState(updateQrLabelAction, undefined);

  React.useEffect(() => {
    if (labelState?.success) {
      toast({ title: "Label updated" });
      setEditOpen(false);
    }
    if (labelState?.error) {
      toast({ title: "Error", description: labelState.error, variant: "destructive" });
    }
  }, [labelState, toast]);

  // ── Regenerate state ────────────────────────────────────────────────────
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [regenState, regenDispatch] = useActionState(regenerateQrCodeAction, undefined);

  React.useEffect(() => {
    if (regenState?.success) {
      toast({
        title: "QR code regenerated",
        description: "The old code is now invalid. Update any printed copies.",
        variant: "default",
      });
      setRegenOpen(false);
    }
    if (regenState?.error) {
      toast({ title: "Error", description: regenState.error, variant: "destructive" });
    }
  }, [regenState, toast]);

  // ── Delete state ────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteState, deleteDispatch] = useActionState(deleteQrCodeAction, undefined);

  React.useEffect(() => {
    if (deleteState?.success) {
      toast({ title: "QR code deleted" });
      setDeleteOpen(false);
    }
    if (deleteState?.error) {
      toast({ title: "Error", description: deleteState.error, variant: "destructive" });
    }
  }, [deleteState, toast]);

  // ── Download PNG ────────────────────────────────────────────────────────
  function downloadPng() {
    const a = document.createElement("a");
    a.href = qr.dataUrl;
    a.download = `qr-${qr.token}.png`;
    a.click();
  }

  // ── Download SVG ────────────────────────────────────────────────────────
  function downloadSvg() {
    const blob = new Blob([qr.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${qr.token}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Print card ──────────────────────────────────────────────────────────
  function printCard() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QR – ${qr.label ?? QR_CODE_LABELS[qr.type]}</title>
  <style>
    @page { size: 85mm 55mm; margin: 0; }
    * { box-sizing: border-box; }
    body {
      width: 85mm; height: 55mm;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
      background: #fff; color: #0f172a;
      padding: 4mm;
      gap: 4mm;
    }
    img { width: 45mm; height: 45mm; flex-shrink: 0; }
    .info { flex: 1; min-width: 0; }
    .label { font-size: 11pt; font-weight: 600; margin-bottom: 2mm; word-break: break-word; }
    .type { font-size: 8pt; color: #64748b; margin-bottom: 3mm; }
    .url { font-size: 7pt; color: #64748b; word-break: break-all; }
  </style>
</head>
<body>
  <img src="${qr.dataUrl}" alt="QR code" />
  <div class="info">
    <div class="label">${qr.label ?? QR_CODE_LABELS[qr.type]}</div>
    <div class="type">${QR_CODE_LABELS[qr.type]}</div>
    <div class="url">${qr.shortUrl}</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        <CardContent className="p-4 flex gap-4 flex-1">
          {/* QR image */}
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.dataUrl}
              alt={`QR code for ${qr.label ?? QR_CODE_LABELS[qr.type]}`}
              width={96}
              height={96}
              className="rounded-md border"
            />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start gap-2 flex-wrap">
              <Badge variant="secondary" className="shrink-0">
                {QR_CODE_LABELS[qr.type]}
              </Badge>
            </div>

            <p className="font-medium leading-tight text-sm truncate">
              {qr.label ?? <span className="text-muted-foreground italic">No label</span>}
            </p>

            <p className="text-xs text-muted-foreground truncate">
              {qr.targetPath}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ScanLine className="h-3.5 w-3.5" />
              <span>{qr.scanCount.toLocaleString()} scan{qr.scanCount !== 1 ? "s" : ""}</span>
            </div>

            <a
              href={qr.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {qr.shortUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>

        <CardFooter className={cn("border-t bg-muted/30 px-4 py-2 flex flex-wrap gap-1.5")}>
          {/* Edit label */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLabelInput(qr.label ?? "");
              setEditOpen(true);
            }}
            title="Edit label"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Label</span>
          </Button>

          {/* Download PNG */}
          <Button variant="ghost" size="sm" onClick={downloadPng} title="Download PNG">
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">PNG</span>
          </Button>

          {/* Download SVG */}
          <Button variant="ghost" size="sm" onClick={downloadSvg} title="Download SVG">
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">SVG</span>
          </Button>

          {/* Print card */}
          <Button variant="ghost" size="sm" onClick={printCard} title="Print card">
            <span className="text-xs">Print</span>
          </Button>

          {/* Regenerate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRegenOpen(true)}
            title="Regenerate token"
            className="text-warning"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Regenerate</span>
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            title="Delete QR code"
            className="text-destructive ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
          </Button>
        </CardFooter>
      </Card>

      {/* ── Edit label dialog ─────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit label</DialogTitle>
            <DialogDescription>
              Give this QR code a descriptive label so you know where it&apos;s placed.
            </DialogDescription>
          </DialogHeader>
          <form action={labelDispatch} className="space-y-4">
            <input type="hidden" name="qrId" value={qr.id} />
            <div className="space-y-1.5">
              <Label htmlFor="qr-edit-label">Label</Label>
              <Input
                id="qr-edit-label"
                name="label"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Bedroom door…"
                maxLength={120}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <SubmitButton pendingText="Saving…">
                <Check className="h-4 w-4" /> Save
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Regenerate confirmation dialog ───────────────────────────────── */}
      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Regenerate QR code?</DialogTitle>
            <DialogDescription>
              This creates a new token. The existing printed QR code will stop working immediately.
              You&apos;ll need to replace any physical copies.
            </DialogDescription>
          </DialogHeader>
          <form action={regenDispatch}>
            <input type="hidden" name="qrId" value={qr.id} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegenOpen(false)}>
                Cancel
              </Button>
              <SubmitButton variant="default" pendingText="Regenerating…">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete QR code?</DialogTitle>
            <DialogDescription>
              Guests who scan the old code will get a &quot;not found&quot; error. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteDispatch}>
            <input type="hidden" name="qrId" value={qr.id} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <SubmitButton variant="destructive" pendingText="Deleting…">
                Delete
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
