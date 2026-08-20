export type Channel = "chat" | "email" | "sms"

export type Message = {
  id: string
  author: "me" | "them"
  body: string
  at: string
  status?: "sent" | "delivered" | "read"
}

/**
 * A conversation owns only the thread. Identity (name, job title, company) and
 * commercial context (deal value/stage) are looked up from the contacts store
 * by `contactId`, so this feature can never disagree with /contacts.
 */
export type Conversation = {
  id: string
  contactId: string
  channel: Channel
  online: boolean
  unreadCount: number
  messages: Message[]
}

/** Timestamps are generated relative to now so the thread always reads fresh. */
const at = (daysAgo: number, hours: number, minutes: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "cv1",
    contactId: "ct1", // Alice Smith
    channel: "chat",
    online: true,
    unreadCount: 2,
    messages: [
      { id: "m1", author: "them", body: "Hi! We reviewed the proposal internally and the team is on board with the scope.", at: at(1, 9, 12) },
      { id: "m2", author: "me", body: "That's great to hear. Anything you'd like adjusted before we move to contract?", at: at(1, 9, 20), status: "read" },
      { id: "m3", author: "them", body: "Two things — the onboarding timeline, and whether the analytics module is included in tier 2.", at: at(1, 9, 24) },
      { id: "m4", author: "me", body: "Analytics is included in tier 2. I can compress onboarding to three weeks if we start before the 15th.", at: at(0, 10, 2), status: "read" },
      { id: "m5", author: "them", body: "That works for us. Can you send the revised SOW today?", at: at(0, 10, 41) },
      { id: "m6", author: "them", body: "Also looping in our finance lead for the payment terms.", at: at(0, 10, 42) },
    ],
  },
  {
    id: "cv2",
    contactId: "ct2", // Bob Jones
    channel: "email",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "m1", author: "me", body: "Following up on the API integration questions from last week.", at: at(3, 14, 5), status: "read" },
      { id: "m2", author: "them", body: "Thanks — the sandbox keys came through. We're testing the webhook flow now.", at: at(2, 11, 30) },
      { id: "m3", author: "me", body: "Perfect. Ping me if the retry behaviour looks off and I'll get an engineer on it.", at: at(2, 11, 48), status: "delivered" },
    ],
  },
  {
    id: "cv3",
    contactId: "ct4", // Diana Prince
    channel: "chat",
    online: true,
    unreadCount: 1,
    messages: [
      { id: "m1", author: "them", body: "Could we get a walkthrough of the reporting dashboard for our design team?", at: at(0, 8, 15) },
    ],
  },
  {
    id: "cv4",
    contactId: "ct5", // Evan Wright
    channel: "sms",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "m1", author: "them", body: "Confirming the call for Thursday at 2pm.", at: at(4, 16, 22) },
      { id: "m2", author: "me", body: "Confirmed — I'll send an invite.", at: at(4, 16, 25), status: "read" },
    ],
  },
  {
    id: "cv5",
    contactId: "ct6", // Fiona Gallagher
    channel: "email",
    online: false,
    unreadCount: 0,
    messages: [
      { id: "m1", author: "them", body: "Signed and countersigned. Looking forward to kickoff!", at: at(6, 12, 0) },
      { id: "m2", author: "me", body: "Wonderful — welcome aboard. Your CSM will reach out Monday.", at: at(6, 12, 18), status: "read" },
    ],
  },
]
