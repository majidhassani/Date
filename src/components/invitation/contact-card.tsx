"use client";

import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import type { OwnerContact } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";

/** Owner (Majid) contact card — rendered only after Nilou accepts. */
export function ContactCard({ owner }: { owner: OwnerContact }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {owner.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              برای هماهنگی، اینم شماره‌ی {owner.name} 👇
            </p>
            <p className="text-lg font-bold tnum" dir="ltr">
              {owner.display}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CopyButton
            value={owner.local}
            label="کپی شماره"
            toastMessage={`شماره‌ی ${owner.name} کپی شد.`}
          />
          <Button asChild variant="outline">
            <a href={owner.telHref}>
              <Phone className="h-4 w-4" />
              تماس
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={owner.smsHref}>
              <MessageSquare className="h-4 w-4" />
              پیامک
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={owner.whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              واتساپ
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
