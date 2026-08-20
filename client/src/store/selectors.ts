import { createSelector } from "@reduxjs/toolkit"

import type { Channel, Message } from "@/components/pages/messages/data"
import type { Activity } from "@/types/crm"
import type { RootState } from "./index"
import { selectAllActivities } from "./activitiesSlice"
import { selectCompanyEntities } from "./companiesSlice"
import { selectContactEntities } from "./contactsSlice"
import { selectAllConversations } from "./conversationsSlice"

/**
 * Cross-entity selectors live here rather than in a slice so that slices never
 * import each other (which would create module cycles through `store/index`).
 */

export type TimelineEntry =
  | { kind: "activity"; id: string; at: string; activity: Activity }
  | {
      kind: "message"
      id: string
      at: string
      message: Message
      channel: Channel
    }

/**
 * A contact's full interaction history: logged activities merged with the real
 * message history from `conversationsSlice`. Messages are *projected*, never
 * copied into the activities slice, so the two can't drift.
 */
export const selectTimelineForContact = createSelector(
  [
    selectAllActivities,
    selectAllConversations,
    (_: RootState, contactId: string) => contactId,
  ],
  (activities, conversations, contactId): TimelineEntry[] => {
    const entries: TimelineEntry[] = activities
      .filter((a) => a.contactId === contactId)
      .map((activity) => ({
        kind: "activity" as const,
        id: activity.id,
        at: activity.at,
        activity,
      }))

    for (const conversation of conversations) {
      if (conversation.contactId !== contactId) continue
      for (const message of conversation.messages) {
        entries.push({
          kind: "message",
          id: `${conversation.id}-${message.id}`,
          at: message.at,
          message,
          channel: conversation.channel,
        })
      }
    }

    return entries.sort((a, b) => b.at.localeCompare(a.at))
  }
)

/** Lead interaction history. Leads have no conversations, so activities only. */
export const selectTimelineForLead = createSelector(
  [selectAllActivities, (_: RootState, leadId: string) => leadId],
  (activities, leadId): TimelineEntry[] =>
    activities
      .filter((a) => a.leadId === leadId)
      .map((activity) => ({
        kind: "activity" as const,
        id: activity.id,
        at: activity.at,
        activity,
      }))
      .sort((a, b) => b.at.localeCompare(a.at))
)

/** Same projection, rolled up to every contact at an account. */
export const selectTimelineForCompany = createSelector(
  [
    selectAllActivities,
    selectAllConversations,
    selectContactEntities,
    (_: RootState, companyId: string) => companyId,
  ],
  (activities, conversations, contacts, companyId): TimelineEntry[] => {
    const entries: TimelineEntry[] = activities
      .filter((a) => a.companyId === companyId)
      .map((activity) => ({
        kind: "activity" as const,
        id: activity.id,
        at: activity.at,
        activity,
      }))

    for (const conversation of conversations) {
      if (contacts[conversation.contactId]?.companyId !== companyId) continue
      for (const message of conversation.messages) {
        entries.push({
          kind: "message",
          id: `${conversation.id}-${message.id}`,
          at: message.at,
          message,
          channel: conversation.channel,
        })
      }
    }

    return entries.sort((a, b) => b.at.localeCompare(a.at))
  }
)

export interface InteractionRow {
  id: string
  activity: Activity
  contactName: string
  companyName: string
}

/** Flattened rows for the global cross-team feed. */
export const selectAllInteractions = createSelector(
  [selectAllActivities, selectContactEntities, selectCompanyEntities],
  (activities, contacts, companies): InteractionRow[] =>
    activities.map((activity) => ({
      id: activity.id,
      activity,
      contactName: activity.contactId
        ? (contacts[activity.contactId]?.name ?? "Unknown contact")
        : "—",
      companyName: activity.companyId
        ? (companies[activity.companyId]?.name ?? "—")
        : "—",
    }))
)

/** Scheduled interactions still ahead of now — powers the dashboard agenda. */
export const selectUpcomingInteractions = createSelector(
  [selectAllActivities, selectContactEntities],
  (activities, contacts) => {
    const now = Date.now()
    return activities
      .filter(
        (a) =>
          a.status === "planned" &&
          a.scheduledAt &&
          new Date(a.scheduledAt).getTime() >= now
      )
      .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))
      .map((activity) => ({
        activity,
        contactName: activity.contactId
        ? (contacts[activity.contactId]?.name ?? "Unknown contact")
        : "—",
      }))
  }
)
