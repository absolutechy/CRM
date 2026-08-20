import type {
  Activity,
  AutomationRule,
  Campaign,
  CampaignMember,
  Company,
  Contact,
  CrmDocument,
  EmailAccount,
  EmailMessage,
  EmailTemplate,
  Lead,
  Deal,
  Task,
  User,
} from "@/types/crm"

/**
 * Seed data migrated from the three arrays that previously held contact info
 * independently:
 *   - `INITIAL_CONTACTS`      (pages/Contacts.tsx)      → name, jobTitle, status
 *   - `people`                (dashboard/PeopleTable)   → phone, location
 *   - `INITIAL_CONVERSATIONS` (messages/data.ts)        → deal value + stage
 *
 * Real values from those sources are preserved; fields none of them carried
 * (address detail, socials) are filled with plausible demo values.
 */

const iso = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/** Future timestamp, for `planned` interactions on the dashboard agenda. */
const soon = (daysAhead: number, hours: number, minutes = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export const SEED_COMPANIES: Company[] = [
  { id: "co1", name: "Acme Corp", industry: "Manufacturing", website: "acme.example.com", location: "Austin, TX", status: "active", createdAt: iso(400) },
  { id: "co2", name: "Globex", industry: "Software", website: "globex.example.com", location: "San Jose, CA", status: "active", createdAt: iso(380) },
  { id: "co3", name: "Initech", industry: "IT Services", website: "initech.example.com", location: "Austin, TX", status: "lead", createdAt: iso(300) },
  { id: "co4", name: "Wayne Ent", industry: "Conglomerate", website: "wayne.example.com", location: "Gotham, NJ", status: "active", createdAt: iso(500) },
  { id: "co5", name: "Stark Ind", industry: "Aerospace", website: "stark.example.com", location: "Malibu, CA", status: "lead", createdAt: iso(220) },
  { id: "co6", name: "Vandelay", industry: "Import/Export", website: "vandelay.example.com", location: "New York City, NY", status: "churned", createdAt: iso(600) },
  { id: "co7", name: "Hogwarts", industry: "Education", website: "hogwarts.example.com", location: "Highlands, UK", status: "active", createdAt: iso(700) },
  // Carried over from the dashboard CompaniesSection table.
  { id: "co8", name: "Product Hunt", industry: "Web Design", website: "producthunt.example.com", location: "New York City, NY", status: "active", createdAt: iso(180) },
  { id: "co9", name: "Google", industry: "Search Engine", website: "google.example.com", location: "New York City, NY", status: "active", createdAt: iso(190) },
  { id: "co10", name: "Wordpress", industry: "Web Development", website: "wordpress.example.com", location: "New York City, NY", status: "active", createdAt: iso(160) },
  { id: "co11", name: "Tripadvisor", industry: "Travel Reviews", website: "tripadvisor.example.com", location: "New York City, NY", status: "lead", createdAt: iso(140) },
  { id: "co12", name: "Slack", industry: "Communication", website: "slack.example.com", location: "New York City, NY", status: "lead", createdAt: iso(120) },
]

type SeedContact = Omit<Contact, "createdAt" | "updatedAt"> & { ageDays: number }

const rawContacts: SeedContact[] = [
  {
    id: "ct1", name: "Alice Smith", jobTitle: "CEO", email: "alice@example.com",
    phone: "(671) 555-0101", companyId: "co1", status: "Active", tags: ["decision-maker"],
    address: { street: "120 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", country: "USA" },
    social: { linkedin: "linkedin.com/in/alicesmith", twitter: "@alicesmith", website: "alicesmith.example.com" },
    ageDays: 210,
  },
  {
    id: "ct2", name: "Bob Jones", jobTitle: "Developer", email: "bob@example.com",
    phone: "(505) 555-0132", companyId: "co2", status: "Inactive", tags: ["technical"],
    address: { street: "88 Innovation Way", city: "San Jose", state: "CA", postalCode: "95110", country: "USA" },
    social: { linkedin: "linkedin.com/in/bobjones", twitter: "", website: "" },
    ageDays: 195,
  },
  {
    id: "ct3", name: "Charlie Brown", jobTitle: "Manager", email: "charlie@example.com",
    phone: "(512) 555-0177", companyId: "co3", status: "Active", tags: [],
    address: { street: "410 Rio Grande St", city: "Austin", state: "TX", postalCode: "78701", country: "USA" },
    social: { linkedin: "linkedin.com/in/charliebrown", twitter: "", website: "" },
    ageDays: 150,
  },
  {
    id: "ct4", name: "Diana Prince", jobTitle: "Designer", email: "diana@example.com",
    phone: "(704) 555-0119", companyId: "co4", status: "Active", tags: ["champion"],
    address: { street: "1007 Mountain Dr", city: "Gotham", state: "NJ", postalCode: "07001", country: "USA" },
    social: { linkedin: "linkedin.com/in/dianaprince", twitter: "@dprince", website: "dianaprince.example.com" },
    ageDays: 130,
  },
  {
    id: "ct5", name: "Evan Wright", jobTitle: "Engineer", email: "evan@example.com",
    phone: "(402) 555-0164", companyId: "co5", status: "Pending", tags: ["technical"],
    address: { street: "10880 Malibu Point", city: "Malibu", state: "CA", postalCode: "90265", country: "USA" },
    social: { linkedin: "linkedin.com/in/evanwright", twitter: "", website: "" },
    ageDays: 90,
  },
  {
    id: "ct6", name: "Fiona Gallagher", jobTitle: "Sales", email: "fiona@example.com",
    phone: "(219) 555-0148", companyId: "co1", status: "Active", tags: ["decision-maker"],
    address: { street: "120 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", country: "USA" },
    social: { linkedin: "linkedin.com/in/fionagallagher", twitter: "@fionag", website: "" },
    ageDays: 85,
  },
  {
    id: "ct7", name: "George Costanza", jobTitle: "Importer", email: "george@example.com",
    phone: "(212) 555-0186", companyId: "co6", status: "Inactive", tags: [],
    address: { street: "129 W 81st St", city: "New York City", state: "NY", postalCode: "10024", country: "USA" },
    social: { linkedin: "", twitter: "", website: "" },
    ageDays: 320,
  },
  {
    id: "ct8", name: "Hannah Abbott", jobTitle: "Student", email: "hannah@example.com",
    phone: "(44) 20 5550 0193", companyId: "co7", status: "Active", tags: [],
    address: { street: "Hufflepuff Basement", city: "Hogsmeade", state: "Highlands", postalCode: "HG1 2WZ", country: "UK" },
    social: { linkedin: "", twitter: "", website: "" },
    ageDays: 60,
  },
  // ---- Carried over from the dashboard PeopleTable (phone + location were real) ----
  {
    id: "ct9", name: "Robert Fox", jobTitle: "Account Executive", email: "robertfox@example.com",
    phone: "(671) 555-0110", companyId: "co8", status: "Active", tags: ["employee"],
    address: { street: "77 Rainey St", city: "Austin", state: "TX", postalCode: "78701", country: "USA" },
    social: { linkedin: "linkedin.com/in/robertfox", twitter: "", website: "" },
    ageDays: 175,
  },
  {
    id: "ct10", name: "Cody Fisher", jobTitle: "Product Manager", email: "codyfisher@example.com",
    phone: "(505) 555-0125", companyId: "co9", status: "Active", tags: ["customer"],
    address: { street: "500 W Orange Ave", city: "Orange", state: "CA", postalCode: "92866", country: "USA" },
    social: { linkedin: "linkedin.com/in/codyfisher", twitter: "", website: "" },
    ageDays: 165,
  },
  {
    id: "ct11", name: "Albert Flores", jobTitle: "Operations Lead", email: "albertflores@example.com",
    phone: "(704) 555-0127", companyId: "co10", status: "Active", tags: ["customer"],
    address: { street: "12 Palmerston Rd", city: "Palmerston", state: "NT", postalCode: "0830", country: "Australia" },
    social: { linkedin: "", twitter: "", website: "" },
    ageDays: 155,
  },
  {
    id: "ct12", name: "Floyd Miles", jobTitle: "Support Engineer", email: "floydmiles@example.com",
    phone: "(402) 555-0128", companyId: "co11", status: "Pending", tags: ["employee"],
    address: { street: "9 Fairfield Ave", city: "Fairfield", state: "CT", postalCode: "06824", country: "USA" },
    social: { linkedin: "", twitter: "", website: "" },
    ageDays: 145,
  },
  {
    id: "ct13", name: "Arlene McCoy", jobTitle: "Partnerships", email: "arlenemccoy@example.com",
    phone: "(219) 555-0114", companyId: "co12", status: "Active", tags: ["partner"],
    address: { street: "45 Toledo St", city: "Toledo", state: "OH", postalCode: "43604", country: "USA" },
    social: { linkedin: "linkedin.com/in/arlenemccoy", twitter: "", website: "" },
    ageDays: 135,
  },
]

export const SEED_CONTACTS: Contact[] = rawContacts.map(({ ageDays, ...c }) => ({
  ...c,
  createdAt: iso(ageDays),
  updatedAt: iso(Math.floor(ageDays / 4)),
}))

/** Deal values/stages carried over from the Messages conversation data. */
export const SEED_DEALS: Deal[] = [
  { id: "dl1", title: "Acme platform rollout", reference: "DEAL-1041", contactId: "ct1", companyId: "co1", ownerId: "u1", amount: 48000, currency: "USD", stage: "Negotiation", probability: 75, expectedCloseDate: soon(14, 12), notes: "Revised SOW with compressed onboarding.", createdAt: iso(40), updatedAt: iso(2) },
  { id: "dl2", title: "Globex API integration", reference: "DEAL-1042", contactId: "ct2", companyId: "co2", ownerId: "u3", amount: 12500, currency: "USD", stage: "Qualified", probability: 50, expectedCloseDate: soon(30, 12), createdAt: iso(35), updatedAt: iso(5) },
  { id: "dl3", title: "Wayne reporting suite", reference: "DEAL-1043", contactId: "ct4", companyId: "co4", ownerId: "u2", amount: 76200, currency: "USD", stage: "Contacted", probability: 25, expectedCloseDate: soon(45, 12), notes: "Wants a design-team walkthrough first.", createdAt: iso(28), updatedAt: iso(1) },
  { id: "dl4", title: "Stark pilot licence", reference: "DEAL-1044", contactId: "ct5", companyId: "co5", ownerId: "u4", amount: 5400, currency: "USD", stage: "New", probability: 10, expectedCloseDate: soon(60, 12), createdAt: iso(20), updatedAt: iso(20) },
  { id: "dl5", title: "Acme expansion — sales team", reference: "DEAL-1045", contactId: "ct6", companyId: "co1", ownerId: "u1", amount: 31000, currency: "USD", stage: "Won", probability: 100, closedAt: iso(6), createdAt: iso(70), updatedAt: iso(6) },
  { id: "dl6", title: "Initech workflow migration", reference: "DEAL-1046", contactId: "ct3", companyId: "co3", ownerId: "u2", amount: 22800, currency: "USD", stage: "Qualified", probability: 50, expectedCloseDate: soon(21, 12), createdAt: iso(52), updatedAt: iso(9) },
  { id: "dl7", title: "Product Hunt annual renewal", reference: "DEAL-1047", contactId: "ct9", companyId: "co8", ownerId: "u3", amount: 18400, currency: "USD", stage: "Won", probability: 100, closedAt: iso(24), createdAt: iso(95), updatedAt: iso(24) },
  { id: "dl8", title: "Google pilot programme", reference: "DEAL-1048", contactId: "ct10", companyId: "co9", ownerId: "u1", amount: 64000, currency: "USD", stage: "Negotiation", probability: 75, expectedCloseDate: soon(10, 12), createdAt: iso(63), updatedAt: iso(3) },
  { id: "dl9", title: "Vandelay reseller agreement", reference: "DEAL-1049", contactId: "ct7", companyId: "co6", ownerId: "u4", amount: 9200, currency: "USD", stage: "Lost", probability: 0, closedAt: iso(31), notes: "Went with an incumbent vendor.", createdAt: iso(110), updatedAt: iso(31) },
  { id: "dl10", title: "Slack partnership tier", reference: "DEAL-1050", contactId: "ct13", companyId: "co12", ownerId: "u2", amount: 41500, currency: "USD", stage: "Qualified", probability: 50, expectedCloseDate: soon(38, 12), createdAt: iso(44), updatedAt: iso(11) },
  { id: "dl11", title: "Wordpress support upgrade", reference: "DEAL-1051", contactId: "ct11", companyId: "co10", ownerId: "u3", amount: 7600, currency: "USD", stage: "Won", probability: 100, closedAt: iso(48), createdAt: iso(120), updatedAt: iso(48) },
  { id: "dl12", title: "Tripadvisor data sync", reference: "DEAL-1052", contactId: "ct12", companyId: "co11", ownerId: "u4", amount: 15300, currency: "USD", stage: "New", probability: 10, expectedCloseDate: soon(52, 12), createdAt: iso(12), updatedAt: iso(12) },
]

export const SEED_TASKS: Task[] = [
  { id: "tk1", title: "Send revised SOW to Acme", description: "Include the compressed three-week onboarding and updated payment terms.", priority: "High", status: "in-progress", assigneeId: "u1", dueDate: soon(1, 17), contactId: "ct1", dealId: "dl1", checklists: [], comments: [], attachments: [], createdAt: iso(2) },
  { id: "tk2", title: "Prepare Wayne dashboard demo", description: "Walk the design team through reporting and custom views.", priority: "High", status: "todo", assigneeId: "u2", dueDate: soon(2, 14), contactId: "ct4", dealId: "dl3", checklists: [], comments: [], attachments: [], createdAt: iso(1) },
  { id: "tk3", title: "Chase Globex webhook feedback", description: "Confirm whether the retry behaviour resolved their timeout.", priority: "Medium", status: "todo", assigneeId: "u3", dueDate: soon(4, 11), contactId: "ct2", dealId: "dl2", checklists: [], comments: [], attachments: [], createdAt: iso(3) },
  { id: "tk4", title: "Qualify Helix Labs security review", description: "Security questionnaire needs completing before the deal progresses.", priority: "Urgent", status: "in-progress", assigneeId: "u2", dueDate: soon(1, 9), leadId: "ld3", checklists: [], comments: [], attachments: [], createdAt: iso(4) },
  { id: "tk5", title: "Follow up on Orbital budget approval", description: "Budget was approved for next quarter — confirm timing.", priority: "Medium", status: "todo", assigneeId: "u1", dueDate: soon(6, 10), leadId: "ld7", checklists: [], comments: [], attachments: [], createdAt: iso(6) },
  { id: "tk6", title: "Draft Google pilot proposal", description: "Scope the pilot programme and pricing for 200 seats.", priority: "High", status: "in-progress", assigneeId: "u1", dueDate: soon(3, 16), contactId: "ct10", dealId: "dl8", checklists: [], comments: [], attachments: [], createdAt: iso(5) },
  { id: "tk7", title: "Assign owner to Cadence HQ lead", description: "Inbound campaign lead is still unassigned.", priority: "Medium", status: "todo", assigneeId: null, dueDate: soon(2, 12), leadId: "ld6", checklists: [], comments: [], attachments: [], createdAt: iso(2) },
  { id: "tk8", title: "Send Acme welcome packet", description: "Expansion deal closed — kick off onboarding.", priority: "Low", status: "done", assigneeId: "u1", contactId: "ct6", dealId: "dl5", checklists: [], comments: [], attachments: [], createdAt: iso(8), completedAt: iso(6) },
  { id: "tk9", title: "Renew Product Hunt contract", description: "Annual renewal signed and filed.", priority: "Medium", status: "done", assigneeId: "u3", contactId: "ct9", dealId: "dl7", checklists: [], comments: [], attachments: [], createdAt: iso(30), completedAt: iso(24) },
  { id: "tk11", title: "Research Helix Labs compliance requirements", description: "SOC2 and data residency questions came up during discovery.", priority: "Low", status: "backlog", assigneeId: "u2", leadId: "ld3", checklists: [], comments: [], attachments: [], createdAt: iso(7) },
  { id: "tk12", title: "Refresh the onboarding email sequence", description: "Current copy predates the analytics module launch.", priority: "Medium", status: "backlog", assigneeId: null, checklists: [], comments: [], attachments: [], createdAt: iso(15) },
  { id: "tk10", title: "Log Slack partnership call notes", description: "Write up the partnership tier discussion.", priority: "Low", status: "done", assigneeId: "u2", contactId: "ct13", dealId: "dl10", checklists: [], comments: [], attachments: [], createdAt: iso(13), completedAt: iso(11) },
]

/** Company lookup so seeded interactions carry their account association. */
const companyOf = (contactId: string) =>
  SEED_CONTACTS.find((c) => c.id === contactId)?.companyId ?? null

type SeedActivity = Omit<Activity, "companyId"> & { companyId?: string | null }

const rawActivities: SeedActivity[] = [
  ...SEED_CONTACTS.map((c, i) => ({
    id: `ac-created-${c.id}`,
    contactId: c.id,
    type: "created" as const,
    status: "logged" as const,
    summary: "Contact created",
    at: c.createdAt,
    actor: i % 2 === 0 ? "John Doe" : "Sarah Lee",
  })),

  // ---- Logged interactions ----
  { id: "ac1", contactId: "ct1", type: "call", status: "logged", direction: "outbound", durationMinutes: 45, summary: "Discovery call", body: "Walked through the pipeline requirements and current tooling.", at: iso(30), actor: "John Doe" },
  { id: "ac2", contactId: "ct1", type: "email", status: "logged", direction: "outbound", summary: "Sent proposal v2", at: iso(12), actor: "John Doe" },
  { id: "ac3", contactId: "ct1", type: "meeting", status: "logged", durationMinutes: 60, summary: "Contract review with finance", at: iso(2), actor: "Sarah Lee" },
  { id: "ac4", contactId: "ct2", type: "note", status: "logged", summary: "Prefers async updates", body: "Wants weekly written summaries rather than calls.", at: iso(22), actor: "Sarah Lee" },
  { id: "ac5", contactId: "ct4", type: "status_change", status: "logged", summary: "Status changed to Active", at: iso(18), actor: "John Doe" },
  { id: "ac6", contactId: "ct4", type: "call", status: "logged", direction: "inbound", durationMinutes: 15, summary: "Dashboard walkthrough request", at: iso(1), actor: "John Doe" },
  { id: "ac7", contactId: "ct6", type: "note", status: "logged", summary: "Deal closed — welcome packet sent", at: iso(6), actor: "Sarah Lee" },
  { id: "ac8", contactId: "ct9", type: "email", status: "logged", direction: "outbound", summary: "Quarterly check-in", at: iso(9), actor: "Sarah Lee" },

  // ---- Customer inquiries (inbound) ----
  { id: "ac9", contactId: "ct3", type: "inquiry", status: "logged", direction: "inbound", summary: "Asked about SSO support", body: "Wants to know whether SAML SSO is available on the current tier.", at: iso(5), actor: "Sarah Lee" },
  { id: "ac10", contactId: "ct5", type: "inquiry", status: "logged", direction: "inbound", summary: "Pricing question for 50 seats", at: iso(3), actor: "John Doe" },
  { id: "ac11", contactId: "ct10", type: "inquiry", status: "logged", direction: "inbound", summary: "Reported slow report exports", body: "Exports over 10k rows time out intermittently.", at: iso(4), actor: "Sarah Lee" },

  // ---- Planned (drives the dashboard agenda) ----
  { id: "ac12", contactId: "ct1", type: "meeting", status: "planned", durationMinutes: 30, summary: "SOW walkthrough", body: "Review revised statement of work and payment terms.", at: soon(1, 10), scheduledAt: soon(1, 10), actor: "John Doe" },
  { id: "ac13", contactId: "ct4", type: "meeting", status: "planned", durationMinutes: 45, summary: "Reporting dashboard demo", at: soon(1, 14), scheduledAt: soon(1, 14), actor: "Sarah Lee" },
  { id: "ac14", contactId: "ct5", type: "call", status: "planned", durationMinutes: 30, summary: "Technical follow-up", at: soon(2, 11), scheduledAt: soon(2, 11), actor: "John Doe" },
  { id: "ac15", contactId: "ct13", type: "meeting", status: "planned", durationMinutes: 60, summary: "Partnership kickoff", at: soon(3, 9, 30), scheduledAt: soon(3, 9, 30), actor: "Sarah Lee" },
]

export const SEED_ACTIVITIES: Activity[] = rawActivities.map((a) => ({
  ...a,
  companyId: a.companyId ?? (a.contactId ? companyOf(a.contactId) : null),
}))

// ---------------------------------------------------------------- Users

export const SEED_USERS: User[] = [
  { id: "u1", name: "John Doe", email: "john.doe@ourcrm.com", role: "admin", avatarColor: "primary" },
  { id: "u2", name: "Sarah Lee", email: "sarah.lee@ourcrm.com", role: "manager", avatarColor: "info" },
  { id: "u3", name: "Marcus Chen", email: "marcus.chen@ourcrm.com", role: "rep", avatarColor: "success" },
  { id: "u4", name: "Priya Nair", email: "priya.nair@ourcrm.com", role: "rep", avatarColor: "warning" },
]

// ---------------------------------------------------------------- Leads

export const SEED_LEADS: Lead[] = [
  { id: "ld1", name: "Marcus Webb", jobTitle: "Head of Ops", email: "marcus.webb@northwind.example", phone: "(312) 555-0142", companyName: "Northwind Traders", source: "web", status: "new", ownerId: "u3", estimatedValue: 18000, notes: "Downloaded the pipeline whitepaper.", campaignId: "cp1", createdAt: iso(4), updatedAt: iso(4) },
  { id: "ld2", name: "Lena Ortiz", jobTitle: "VP Marketing", email: "lena.ortiz@brightpath.example", phone: "(415) 555-0188", companyName: "Brightpath Media", source: "referral", status: "contacted", ownerId: "u1", estimatedValue: 42000, notes: "Referred by Alice Smith at Acme.", createdAt: iso(11), updatedAt: iso(3) },
  { id: "ld3", name: "Tomas Berg", jobTitle: "CTO", email: "tomas.berg@helixlabs.example", phone: "(206) 555-0173", companyName: "Helix Labs", source: "event", status: "qualified", ownerId: "u2", estimatedValue: 96000, notes: "Met at SaaStr. Wants a security review.", campaignId: "cp2", createdAt: iso(19), updatedAt: iso(2) },
  { id: "ld4", name: "Amara Okafor", jobTitle: "Procurement Lead", email: "amara.okafor@vertexgroup.example", phone: "(646) 555-0126", companyName: "Vertex Group", source: "outreach", status: "contacted", ownerId: "u4", estimatedValue: 27500, createdAt: iso(8), updatedAt: iso(5) },
  { id: "ld5", name: "Ruben Diaz", jobTitle: "Founder", email: "ruben@quietforge.example", phone: "(512) 555-0155", companyName: "Quietforge", source: "web", status: "unqualified", ownerId: "u3", estimatedValue: 3000, notes: "Team of 2 — below our minimum seat count.", createdAt: iso(25), updatedAt: iso(20) },
  { id: "ld6", name: "Sofia Marchetti", jobTitle: "Sales Director", email: "sofia.m@cadencehq.example", phone: "(917) 555-0134", companyName: "Cadence HQ", source: "campaign", status: "new", ownerId: null, estimatedValue: 55000, campaignId: "cp1", createdAt: iso(2), updatedAt: iso(2) },
  { id: "ld7", name: "Daniel Kwon", jobTitle: "IT Manager", email: "d.kwon@orbitalsys.example", phone: "(408) 555-0117", companyName: "Orbital Systems", source: "referral", status: "qualified", ownerId: "u1", estimatedValue: 64000, notes: "Budget approved for next quarter.", createdAt: iso(30), updatedAt: iso(6) },
  { id: "ld8", name: "Grace Mbeki", jobTitle: "COO", email: "grace@lumenpartners.example", phone: "(303) 555-0199", companyName: "Lumen Partners", source: "event", status: "contacted", ownerId: "u2", estimatedValue: 33000, campaignId: "cp2", createdAt: iso(14), updatedAt: iso(7) },
]

// ---------------------------------------------------------------- Email

export const SEED_EMAIL_ACCOUNTS: EmailAccount[] = [
  { id: "ea1", address: "john.doe@ourcrm.com", provider: "gmail", displayName: "John Doe", connected: false },
  { id: "ea2", address: "sales@ourcrm.com", provider: "outlook", displayName: "Sales Team", connected: false },
]

export const SEED_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: "et1", name: "Intro — inbound lead", category: "Prospecting", subject: "Thanks for reaching out, {{firstName}}", body: "<p>Hi {{firstName}},</p><p>Thanks for your interest in our platform. I'd love to learn more about what {{company}} is trying to solve.</p><p>Are you free for a short call this week?</p><p>Best,<br/>{{senderName}}</p>", updatedAt: iso(20) },
  { id: "et2", name: "Follow-up after demo", category: "Sales", subject: "Recap + next steps", body: "<p>Hi {{firstName}},</p><p>Great speaking with you today. As promised, here's a recap of what we covered and the next steps for {{company}}.</p><p>Let me know if anything looks off.</p><p>Best,<br/>{{senderName}}</p>", updatedAt: iso(12) },
  { id: "et3", name: "Proposal delivery", category: "Sales", subject: "Your proposal from {{senderName}}", body: "<p>Hi {{firstName}},</p><p>Attached is the proposal we discussed for {{company}}. It covers scope, timeline and pricing.</p><p>Happy to walk through it whenever suits.</p>", updatedAt: iso(9) },
  { id: "et4", name: "Re-engagement", category: "Nurture", subject: "Still thinking it over, {{firstName}}?", body: "<p>Hi {{firstName}},</p><p>It's been a little while — I wanted to check whether now is a better time to revisit this for {{company}}.</p>", updatedAt: iso(5) },
]

export const SEED_EMAIL_MESSAGES: EmailMessage[] = [
  { id: "em1", accountId: "ea1", contactId: "ct1", companyId: "co1", subject: "Revised SOW + payment terms", body: "<p>Hi Alice, attaching the revised SOW as discussed.</p>", from: "john.doe@ourcrm.com", to: ["alice@example.com"], cc: [], templateId: "et3", status: "sent", sentAt: iso(1), openedAt: iso(1) },
  { id: "em2", accountId: "ea1", contactId: "ct1", companyId: "co1", subject: "Recap + next steps", body: "<p>Great speaking with you today.</p>", from: "john.doe@ourcrm.com", to: ["alice@example.com"], cc: [], templateId: "et2", status: "sent", sentAt: iso(12), openedAt: iso(12), clickedAt: iso(11) },
  { id: "em3", accountId: "ea1", contactId: "ct2", companyId: "co2", subject: "API sandbox credentials", body: "<p>Sandbox keys are attached.</p>", from: "john.doe@ourcrm.com", to: ["bob@example.com"], cc: [], status: "sent", sentAt: iso(3) },
  { id: "em4", accountId: "ea2", leadId: "ld3", subject: "Thanks for reaching out, Tomas", body: "<p>Thanks for your interest.</p>", from: "sales@ourcrm.com", to: ["tomas.berg@helixlabs.example"], cc: [], templateId: "et1", status: "sent", sentAt: iso(18), openedAt: iso(18) },
  { id: "em5", accountId: "ea1", contactId: "ct4", companyId: "co4", subject: "Reporting dashboard walkthrough", body: "<p>Sharing a few times for the walkthrough.</p>", from: "john.doe@ourcrm.com", to: ["diana@example.com"], cc: ["sarah.lee@ourcrm.com"], status: "draft" },
  { id: "em6", accountId: "ea2", leadId: "ld2", subject: "Still thinking it over, Lena?", body: "<p>Checking whether now is a better time.</p>", from: "sales@ourcrm.com", to: ["lena.ortiz@brightpath.example"], cc: [], templateId: "et4", status: "sent", sentAt: iso(4) },
]

// ---------------------------------------------------------------- Documents

export const SEED_DOCUMENTS: CrmDocument[] = [
  { id: "dc1", name: "Acme_Proposal_v3.pdf", mimeType: "application/pdf", sizeBytes: 2_411_724, category: "proposal", contactId: "ct1", companyId: "co1", uploadedById: "u1", uploadedAt: iso(2) },
  { id: "dc2", name: "Acme_Pricing_Tiers.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 831_488, category: "quote", contactId: "ct1", companyId: "co1", uploadedById: "u1", uploadedAt: iso(5) },
  { id: "dc3", name: "Globex_MSA_signed.pdf", mimeType: "application/pdf", sizeBytes: 1_204_992, category: "contract", contactId: "ct2", companyId: "co2", uploadedById: "u2", uploadedAt: iso(14) },
  { id: "dc4", name: "Wayne_Security_Review.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 445_030, category: "other", contactId: "ct4", companyId: "co4", uploadedById: "u2", uploadedAt: iso(7) },
  { id: "dc5", name: "HelixLabs_Discovery_Notes.pdf", mimeType: "application/pdf", sizeBytes: 318_002, category: "other", leadId: "ld3", uploadedById: "u2", uploadedAt: iso(9) },
  { id: "dc6", name: "Orbital_Quote_Q3.pdf", mimeType: "application/pdf", sizeBytes: 987_112, category: "quote", leadId: "ld7", uploadedById: "u1", uploadedAt: iso(6) },
  { id: "dc7", name: "Stark_Statement_of_Work.pdf", mimeType: "application/pdf", sizeBytes: 1_662_310, category: "contract", contactId: "ct5", companyId: "co5", uploadedById: "u4", uploadedAt: iso(11) },
]

// ---------------------------------------------------------------- Campaigns

export const SEED_CAMPAIGNS: Campaign[] = [
  { id: "cp1", name: "Q3 Inbound Nurture", type: "email", status: "active", startDate: iso(30), endDate: soon(30, 9), goal: "Convert 20 inbound signups to qualified leads", budget: 4000, ownerId: "u1", templateId: "et1", createdAt: iso(35) },
  { id: "cp2", name: "SaaStr 2026 Follow-up", type: "event", status: "active", startDate: iso(21), endDate: soon(10, 9), goal: "Book 15 post-event demos", budget: 12000, ownerId: "u2", templateId: "et2", createdAt: iso(28) },
  { id: "cp3", name: "Analytics Module Launch", type: "webinar", status: "scheduled", startDate: soon(12, 10), goal: "300 registrations", budget: 6500, ownerId: "u1", templateId: null, createdAt: iso(6) },
  { id: "cp4", name: "Dormant Account Win-back", type: "email", status: "paused", startDate: iso(60), endDate: iso(10), goal: "Re-engage 50 dormant accounts", budget: 2500, ownerId: "u4", templateId: "et4", createdAt: iso(65) },
  { id: "cp5", name: "Spring Partner Push", type: "social", status: "completed", startDate: iso(120), endDate: iso(60), goal: "Generate 40 partner-sourced leads", budget: 9000, ownerId: "u2", templateId: null, createdAt: iso(130) },
]

export const SEED_CAMPAIGN_MEMBERS: CampaignMember[] = [
  { id: "cm1", campaignId: "cp1", leadId: "ld1", response: "opened", addedAt: iso(4) },
  { id: "cm2", campaignId: "cp1", leadId: "ld6", response: "none", addedAt: iso(2) },
  { id: "cm3", campaignId: "cp1", contactId: "ct3", response: "clicked", addedAt: iso(15) },
  { id: "cm4", campaignId: "cp1", contactId: "ct10", response: "replied", addedAt: iso(18) },
  { id: "cm5", campaignId: "cp2", leadId: "ld3", response: "converted", addedAt: iso(19) },
  { id: "cm6", campaignId: "cp2", leadId: "ld8", response: "opened", addedAt: iso(14) },
  { id: "cm7", campaignId: "cp2", contactId: "ct1", response: "replied", addedAt: iso(20) },
  { id: "cm8", campaignId: "cp2", contactId: "ct4", response: "clicked", addedAt: iso(17) },
  { id: "cm9", campaignId: "cp4", contactId: "ct7", response: "none", addedAt: iso(55) },
  { id: "cm10", campaignId: "cp4", contactId: "ct2", response: "opened", addedAt: iso(50) },
  { id: "cm11", campaignId: "cp5", contactId: "ct13", response: "converted", addedAt: iso(110) },
  { id: "cm12", campaignId: "cp5", contactId: "ct9", response: "clicked", addedAt: iso(100) },
]

// ---------------------------------------------------------------- Automation

export const SEED_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "ar1",
    name: "Assign new inbound leads",
    description: "Route web leads to a rep so nothing sits unowned.",
    enabled: true,
    trigger: { entity: "lead", event: "created" },
    conditions: [{ id: "rc1", field: "source", operator: "is", value: "web" }],
    actions: [
      { id: "ra1", type: "assign_owner", params: { userId: "u3" } },
      { id: "ra2", type: "create_task", params: { title: "Call new inbound lead", dueInDays: "1" } },
    ],
    createdAt: iso(40),
    updatedAt: iso(12),
  },
  {
    id: "ar2",
    name: "Follow up on stalled deals",
    description: "Nudge the owner when a qualified lead goes quiet.",
    enabled: true,
    trigger: { entity: "lead", event: "inactive_for" },
    conditions: [
      { id: "rc2", field: "status", operator: "is", value: "qualified" },
      { id: "rc3", field: "daysInactive", operator: "gt", value: "14" },
    ],
    actions: [
      { id: "ra3", type: "send_notification", params: { message: "Qualified lead has gone quiet for 14 days" } },
      { id: "ra4", type: "create_task", params: { title: "Re-engage stalled lead", dueInDays: "2" } },
    ],
    createdAt: iso(33),
    updatedAt: iso(8),
  },
  {
    id: "ar3",
    name: "Welcome converted customers",
    description: "Send the onboarding email once a lead converts.",
    enabled: false,
    trigger: { entity: "lead", event: "stage_changed" },
    conditions: [{ id: "rc4", field: "status", operator: "is", value: "converted" }],
    actions: [{ id: "ra5", type: "send_email", params: { templateId: "et2" } }],
    createdAt: iso(22),
    updatedAt: iso(22),
  },
  {
    id: "ar4",
    name: "Flag high-value opportunities",
    description: "Escalate large deals to a manager for review.",
    enabled: true,
    trigger: { entity: "lead", event: "updated" },
    conditions: [{ id: "rc5", field: "estimatedValue", operator: "gt", value: "50000" }],
    actions: [
      { id: "ra6", type: "assign_owner", params: { userId: "u2" } },
      { id: "ra7", type: "send_notification", params: { message: "High-value lead needs manager review" } },
    ],
    createdAt: iso(16),
    updatedAt: iso(4),
  },
]
