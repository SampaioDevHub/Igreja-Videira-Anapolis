import { NotificationData } from "../NotificationData"

export interface NotificationModalProps {
  open: boolean
  onClose: () => void
  notifications: NotificationData[]
  onDelete: (index: number) => void
}