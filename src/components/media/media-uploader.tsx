"use client";

import React, { useCallback, useRef, useState, useActionState } from "react";
import { Upload, X, Film, Image as ImageIcon, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SubmitButton } from "@/components/shared/submit-button";
import { requestUpload, createMedia } from "@/server/media";
import type { RequestUploadResult } from "@/server/media";

type MediaType = "IMAGE" | "VIDEO" | "PDF" | "FILE";

const ACCEPT_MAP: Record<MediaType, string> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
  PDF: "application/pdf",
  FILE: "*/*",
};

const TYPE_ICON: Record<MediaType, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: Film,
  PDF: FileText,
  FILE: File,
};

interface MediaUploaderProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function MediaUploader({ propertyId, onSuccess }: MediaUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaType, setMediaType] = useState<MediaType>("IMAGE");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [createState, createAction] = useActionState(createMedia, undefined);

  React.useEffect(() => {
    if (createState?.success) {
      toast({ title: "Media uploaded successfully." });
      setFile(null);
      setTitle("");
      setTopic("");
      setUploading(false);
      onSuccess?.();
    } else if (createState?.error) {
      toast({ title: "Upload failed", description: createState.error, variant: "destructive" });
      setUploading(false);
    }
  }, [createState, toast, onSuccess]);

  const handleFileChange = useCallback((picked: File | null | undefined) => {
    if (!picked) return;
    setFile(picked);
    // Auto-detect media type
    if (picked.type.startsWith("video/")) setMediaType("VIDEO");
    else if (picked.type.startsWith("image/")) setMediaType("IMAGE");
    else if (picked.type === "application/pdf") setMediaType("PDF");
    else setMediaType("FILE");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      handleFileChange(dropped);
    },
    [handleFileChange],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    // Step 1: request an upload target from the server.
    const reqFd = new FormData();
    reqFd.set("propertyId", propertyId);
    reqFd.set("fileName", file.name);
    reqFd.set("contentType", file.type || "application/octet-stream");
    reqFd.set("mediaType", mediaType);

    let uploadResult: RequestUploadResult;
    try {
      // Server actions are callable directly from client components.
      const res = await requestUpload(undefined, reqFd);
      uploadResult = res as RequestUploadResult;
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
      setUploading(false);
      return;
    }

    if (!uploadResult.ok) {
      toast({ title: "Upload blocked", description: uploadResult.error, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { target } = uploadResult;

    // Step 2: PUT the file to the upload URL.
    try {
      const putRes = await fetch(target.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error(`PUT ${putRes.status}`);
    } catch (err) {
      toast({ title: "File transfer failed", description: String(err), variant: "destructive" });
      setUploading(false);
      return;
    }

    // Step 3: register the media record via server action.
    const createFd = new FormData();
    createFd.set("propertyId", propertyId);
    createFd.set("url", target.publicUrl);
    createFd.set("fileName", file.name);
    createFd.set("fileSize", String(file.size));
    createFd.set("mimeType", file.type || "application/octet-stream");
    createFd.set("type", mediaType);
    if (title) createFd.set("title", title);
    if (topic) createFd.set("topic", topic);

    // Trigger via the form action (useActionState will pick it up).
    createAction(createFd);
  };

  const TypeIcon = TYPE_ICON[mediaType];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          file && "border-primary/50 bg-primary/5",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={ACCEPT_MAP[mediaType]}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <TypeIcon className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 gap-1 text-xs text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-3 w-3" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click or drag a file here</p>
            <p className="text-xs text-muted-foreground">
              Image, video, PDF or any file — max 200 MB
            </p>
          </div>
        )}
      </div>

      {/* Media type selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={mediaType}
            onValueChange={(v) => setMediaType(v as MediaType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IMAGE">Image</SelectItem>
              <SelectItem value="VIDEO">Video</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="FILE">File</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
          <Input
            placeholder="e.g. Keybox walkthrough"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Topic (optional)
          </label>
          <Input
            placeholder="e.g. check-in, heating"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={80}
          />
        </div>
      </div>

      {createState?.error && (
        <p className="text-sm text-destructive">{createState.error}</p>
      )}

      <SubmitButton
        disabled={!file || uploading}
        pendingText="Uploading…"
        className="w-full sm:w-auto"
      >
        <Upload className="h-4 w-4" />
        Upload media
      </SubmitButton>
    </form>
  );
}
