"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, QrCode, Trash2 } from "lucide-react";
import { deletePropertyAction, togglePublishAction } from "@/server/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { SubmitButton } from "@/components/shared/submit-button";

export function PropertySidePanel({
  propertyId,
  publicUrl,
  isPublished,
}: {
  propertyId: string;
  publicUrl: string;
  isPublished: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guest guide link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input readOnly value={publicUrl} className="text-xs" />
          <div className="flex gap-2">
            <CopyButton value={publicUrl} className="flex-1" />
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> Open
              </a>
            </Button>
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link href={`/properties/${propertyId}/qr`}>
              <QrCode /> QR codes
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {isPublished
              ? "This guide is live and accessible to guests."
              : "This guide is a draft and not yet public."}
          </p>
          <form action={togglePublishAction}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <SubmitButton variant={isPublished ? "outline" : "default"} className="w-full">
              {isPublished ? "Unpublish guide" : "Publish guide"}
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 /> Delete property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this property?</DialogTitle>
                <DialogDescription>
                  This permanently deletes the property, its guide, media, QR codes and all related
                  data. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <form action={deletePropertyAction}>
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <SubmitButton variant="destructive" pendingText="Deleting…">
                    Delete permanently
                  </SubmitButton>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
