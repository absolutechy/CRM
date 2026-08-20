import {
  Building2,
  Globe,
  // lucide-react v1 dropped brand icons; these stand in for LinkedIn / X.
  Link2 as Linkedin,
  Mail,
  MapPin,
  Phone,
  X as Twitter,
} from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { formatAddress, formatDate, hasAddress } from "@/lib/crm"
import type { Company, Contact } from "@/types/crm"

interface ContactProfileTabProps {
  contact: Contact
  company?: Company
}

const Field: React.FC<{
  icon: React.ElementType
  label: string
  children: React.ReactNode
}> = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100">
      <Icon className="size-4 text-primary-700" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm break-words text-foreground">{children}</div>
    </div>
  </div>
)

const empty = <span className="text-muted-foreground">Not provided</span>

const externalHref = (value: string) =>
  value.startsWith("http") ? value : `https://${value}`

const ContactProfileTab: React.FC<ContactProfileTabProps> = ({
  contact,
  company,
}) => {
  const { social, address } = contact

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contact details */}
      <section className="space-y-5 rounded-lg border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-foreground">
          Contact details
        </h3>

        <Field icon={Mail} label="Email">
          <a
            href={`mailto:${contact.email}`}
            className="text-primary hover:underline"
          >
            {contact.email}
          </a>
        </Field>

        <Field icon={Phone} label="Phone">
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="text-primary hover:underline"
            >
              {contact.phone}
            </a>
          ) : (
            empty
          )}
        </Field>

        <Field icon={Building2} label="Company">
          {company ? (
            <Link
              to={`/companies/${company.id}`}
              className="text-primary hover:underline"
            >
              {company.name}
            </Link>
          ) : (
            empty
          )}
        </Field>

        <Field icon={MapPin} label="Address">
          {hasAddress(address) ? formatAddress(address) : empty}
        </Field>
      </section>

      {/* Social + meta */}
      <div className="space-y-6">
        <section className="space-y-5 rounded-lg border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">
            Social profiles
          </h3>

          <Field icon={Linkedin} label="LinkedIn">
            {social.linkedin ? (
              <a
                href={externalHref(social.linkedin)}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {social.linkedin}
              </a>
            ) : (
              empty
            )}
          </Field>

          <Field icon={Twitter} label="X / Twitter">
            {social.twitter || empty}
          </Field>

          <Field icon={Globe} label="Website">
            {social.website ? (
              <a
                href={externalHref(social.website)}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {social.website}
              </a>
            ) : (
              empty
            )}
          </Field>
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-foreground">Record</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-foreground">{formatDate(contact.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="text-foreground">{formatDate(contact.updatedAt)}</dd>
            </div>
            {contact.tags.length > 0 && (
              <div className="flex items-start justify-between gap-4 pt-1">
                <dt className="text-muted-foreground">Tags</dt>
                <dd className="flex flex-wrap justify-end gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="muted">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  )
}

export default ContactProfileTab
