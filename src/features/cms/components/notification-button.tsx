import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotificationButton({ unreadCount }: { unreadCount: number }) {
  const label =
    unreadCount === 0
      ? "No unread notifications"
      : `${unreadCount} unread notifications`;

  return (
    <Button aria-label={label} size="icon" type="button" variant="outline">
      <span className="relative">
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="bg-error text-error-foreground absolute -top-2 -right-2 grid size-4 place-items-center rounded-full text-[10px] leading-none font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
