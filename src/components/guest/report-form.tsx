"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { submitIssueAction } from "@/server/guest";
import { ISSUE_CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const URGENCIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function ReportForm({ slug }: { slug: string }) {
  const [category, setCategory] = useState("OTHER");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("slug", slug);
    fd.set("category", category);
    fd.set("urgency", urgency);

    try {
      // Upload any photos first, then attach their URLs.
      const urls: string[] = [];
      for (const file of files) {
        const upload = new FormData();
        upload.set("file", file);
        const res = await fetch(`/api/g/${slug}/upload`, { method: "POST", body: upload });
        if (res.ok) {
          const data = await res.json();
          if (data.publicUrl) urls.push(data.publicUrl);
        }
      }
      fd.set("photos", urls.join(","));

      const result = await submitIssueAction(undefined, fd);
      if (result?.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your report has reached the host. They&apos;ll get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot — hidden from humans */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="space-y-2">
        <Label htmlFor="title">What&apos;s the problem?</Label>
        <Input id="title" name="title" placeholder="e.g. Heating not working in the bedroom" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ISSUE_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {URGENCIES.map((u) => (
                <SelectItem key={u} value={u}>
                  {u.charAt(0) + u.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomLocation">Where? (optional)</Label>
        <Input id="roomLocation" name="roomLocation" placeholder="Bedroom, kitchen, entrance…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details (optional)</Label>
        <Textarea id="description" name="description" rows={4} placeholder="Tell us what happened" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos">Photos (optional)</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          {files.length > 0 ? `${files.length} photo(s) selected` : "Add photos"}
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="guestName">Your name (optional)</Label>
          <Input id="guestName" name="guestName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestContact">Email or phone (optional)</Label>
          <Input id="guestContact" name="guestContact" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" && <Loader2 className="animate-spin" />}
        Send report
      </Button>
    </form>
  );
}
