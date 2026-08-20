import { nanoid } from "@reduxjs/toolkit"
import { Plus, Trash2, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ACTION_TYPES,
  actionMeta,
  fieldsFor,
  operatorsFor,
  TRIGGER_ENTITIES,
  TRIGGER_EVENTS,
  type FieldSchema,
} from "@/lib/automationSchema"
import { useAppSelector } from "@/store/hooks"
import { selectAllTemplates } from "@/store/emailSlice"
import { selectAllUsers } from "@/store/usersSlice"
import type { RuleDraft } from "@/store/automationsSlice"
import type {
  ActionType,
  ConditionOperator,
  TriggerEntity,
  TriggerEvent,
} from "@/types/crm"

interface RuleBuilderProps {
  draft: RuleDraft
  onChange: (draft: RuleDraft) => void
}

const Section: React.FC<{
  step: number
  title: string
  hint: string
  children: React.ReactNode
}> = ({ step, title, hint, children }) => (
  <section className="rounded-lg border border-border bg-surface p-6">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
    {children}
  </section>
)

const RuleBuilder: React.FC<RuleBuilderProps> = ({ draft, onChange }) => {
  const users = useAppSelector(selectAllUsers)
  const templates = useAppSelector(selectAllTemplates)

  const set = <K extends keyof RuleDraft>(key: K, value: RuleDraft[K]) =>
    onChange({ ...draft, [key]: value })

  const fields = fieldsFor(draft.trigger.entity)

  /** Renders the right input for a field's declared type. */
  const paramInput = (
    schema: FieldSchema,
    value: string,
    onValueChange: (v: string) => void,
    id: string
  ) => {
    if (schema.type === "user") {
      return (
        <Select value={value || ""} onValueChange={onValueChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    if (schema.type === "select" && schema.options) {
      return (
        <Select value={value || ""} onValueChange={onValueChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {schema.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    if (schema.name === "templateId") {
      return (
        <Select value={value || ""} onValueChange={onValueChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    return (
      <Input
        id={id}
        type={schema.type === "number" ? "number" : schema.type === "date" ? "date" : "text"}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={schema.label}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Name */}
      <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="space-y-1.5">
          <Label htmlFor="rule-name">Rule name *</Label>
          <Input
            id="rule-name"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Assign new inbound leads"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-desc">Description</Label>
          <Textarea
            id="rule-desc"
            value={draft.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="What this automation is for..."
          />
        </div>
      </section>

      {/* Trigger */}
      <Section
        step={1}
        title="Trigger"
        hint="The event that starts this automation."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="trigger-entity">When a</Label>
            <Select
              value={draft.trigger.entity}
              onValueChange={(v) =>
                // Conditions reference entity fields, so reset them on change.
                onChange({
                  ...draft,
                  trigger: { ...draft.trigger, entity: v as TriggerEntity },
                  conditions: [],
                })
              }
            >
              <SelectTrigger id="trigger-entity" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_ENTITIES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trigger-event">Event</Label>
            <Select
              value={draft.trigger.event}
              onValueChange={(v) =>
                set("trigger", { ...draft.trigger, event: v as TriggerEvent })
              }
            >
              <SelectTrigger id="trigger-event" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_EVENTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Conditions */}
      <Section
        step={2}
        title="Conditions"
        hint="All conditions must match. Leave empty to run every time."
      >
        <div className="space-y-3">
          {draft.conditions.map((condition, i) => {
            const schema = fields.find((f) => f.name === condition.field)
            const ops = operatorsFor(schema?.type ?? "text")
            return (
              <div
                key={condition.id}
                className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-background p-3"
              >
                <span className="pb-2 text-xs font-medium text-muted-foreground">
                  {i === 0 ? "WHERE" : "AND"}
                </span>

                <div className="min-w-36 flex-1 space-y-1.5">
                  <Label className="text-xs">Field</Label>
                  <Select
                    value={condition.field}
                    onValueChange={(v) =>
                      set(
                        "conditions",
                        draft.conditions.map((c) =>
                          c.id === condition.id
                            ? { ...c, field: v, value: "" }
                            : c
                        )
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((f) => (
                        <SelectItem key={f.name} value={f.name}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-32 flex-1 space-y-1.5">
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(v) =>
                      set(
                        "conditions",
                        draft.conditions.map((c) =>
                          c.id === condition.id
                            ? { ...c, operator: v as ConditionOperator }
                            : c
                        )
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ops.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {condition.operator !== "is_empty" && (
                  <div className="min-w-36 flex-1 space-y-1.5">
                    <Label className="text-xs">Value</Label>
                    {schema ? (
                      paramInput(
                        schema,
                        condition.value,
                        (v) =>
                          set(
                            "conditions",
                            draft.conditions.map((c) =>
                              c.id === condition.id ? { ...c, value: v } : c
                            )
                          ),
                        `cond-${condition.id}`
                      )
                    ) : (
                      <Input
                        value={condition.value}
                        onChange={(e) =>
                          set(
                            "conditions",
                            draft.conditions.map((c) =>
                              c.id === condition.id
                                ? { ...c, value: e.target.value }
                                : c
                            )
                          )
                        }
                      />
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove condition"
                  onClick={() =>
                    set(
                      "conditions",
                      draft.conditions.filter((c) => c.id !== condition.id)
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("conditions", [
                ...draft.conditions,
                {
                  id: nanoid(),
                  field: fields[0]?.name ?? "",
                  operator: "is",
                  value: "",
                },
              ])
            }
            disabled={fields.length === 0}
          >
            <Plus />
            Add condition
          </Button>
        </div>
      </Section>

      {/* Actions */}
      <Section
        step={3}
        title="Actions"
        hint="What should happen when the trigger and conditions match."
      >
        <div className="space-y-3">
          {draft.actions.map((action) => {
            const meta = actionMeta(action.type)
            return (
              <div
                key={action.id}
                className="space-y-3 rounded-md border border-border bg-background p-3"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Action</Label>
                    <Select
                      value={action.type}
                      onValueChange={(v) =>
                        set(
                          "actions",
                          draft.actions.map((a) =>
                            a.id === action.id
                              ? { ...a, type: v as ActionType, params: {} }
                              : a
                          )
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove action"
                    onClick={() =>
                      set(
                        "actions",
                        draft.actions.filter((a) => a.id !== action.id)
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>

                {meta && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {meta.params.map((param) => (
                        <div key={param.name} className="space-y-1.5">
                          <Label
                            htmlFor={`act-${action.id}-${param.name}`}
                            className="text-xs"
                          >
                            {param.label}
                          </Label>
                          {paramInput(
                            param,
                            action.params[param.name] ?? "",
                            (v) =>
                              set(
                                "actions",
                                draft.actions.map((a) =>
                                  a.id === action.id
                                    ? {
                                        ...a,
                                        params: { ...a.params, [param.name]: v },
                                      }
                                    : a
                                )
                              ),
                            `act-${action.id}-${param.name}`
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("actions", [
                ...draft.actions,
                { id: nanoid(), type: "create_task", params: {} },
              ])
            }
          >
            <Zap />
            Add action
          </Button>
        </div>
      </Section>
    </div>
  )
}

export default RuleBuilder
