"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

export interface NotificationData {
  title: string
  body: string
  date: string
}

interface NotificationModalProps {
  open: boolean
  onClose: () => void
  notifications: NotificationData[]
  onDelete: (index: number) => void
}

export function NotificationModal({
  open,
  onClose,
  notifications,
  onDelete,
}: NotificationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notificações Recentes</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-64 pr-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4 text-center">Nenhuma notificação recente.</p>
          ) : (
            notifications.map((notif, index) => (
              <div
                key={index}
                className="mb-3 border-b pb-2 flex justify-between items-start gap-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{notif.date}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(index)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
