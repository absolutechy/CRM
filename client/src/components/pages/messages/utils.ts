import { Mail, MessageSquare, Smartphone } from "lucide-react"
import type { Channel, Conversation } from "./data"

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

/** Stable per-day bucket key, used to group messages under day separators. */
export const dayKey = (iso: string) => new Date(iso).toDateString()

export const formatDayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}

/** Compact timestamp for the conversation list (time today, else day/date). */
export const formatListTimestamp = (iso: string) => {
  const label = formatDayLabel(iso)
  return label === "Today" ? formatTime(iso) : label
}

export const CHANNEL_META: Record<
  Channel,
  { label: string; icon: typeof Mail; badge: "info" | "accent" | "muted" }
> = {
  email: { label: "Email", icon: Mail, badge: "info" },
  chat: { label: "Chat", icon: MessageSquare, badge: "accent" },
  sms: { label: "SMS", icon: Smartphone, badge: "muted" },
}

export const lastMessageOf = (c: Conversation) => c.messages[c.messages.length - 1]
