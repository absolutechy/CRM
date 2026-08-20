import { useState } from "react"
import { Info, Plus, Trash2, Workflow, Zap } from "lucide-react"
import { Link, useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { actionMeta, TRIGGER_ENTITIES, TRIGGER_EVENTS } from "@/lib/automationSchema"
import { formatDate } from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  ruleAdded,
  ruleRemoved,
  ruleToggled,
  selectAllRules,
} from "@/store/automationsSlice"
import type { AutomationRule } from "@/types/crm"

const triggerSummary = (rule: AutomationRule) => {
  const entity = TRIGGER_ENTITIES.find(
    (e) => e.value === rule.trigger.entity
  )?.label
  const event = TRIGGER_EVENTS.find((e) => e.value === rule.trigger.event)?.label
  return `When a ${entity?.toLowerCase()} ${event}`
}

const Automations = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const rules = useAppSelector(selectAllRules)
  const [pendingDelete, setPendingDelete] = useState<AutomationRule | null>(null)

  const handleCreate = () => {
    const action = dispatch(
      ruleAdded({
        name: "Untitled rule",
        description: "",
        enabled: false,
        trigger: { entity: "lead", event: "created" },
        conditions: [],
        actions: [],
      })
    )
    navigate(`/automations/${action.payload.id}`)
  }

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        {/* Honest state — rules don't execute yet. */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-info-soft p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-info-strong" />
          <div className="text-sm">
            <p className="font-medium text-info-strong">
              Rules are saved but not running yet
            </p>
            <p className="text-muted-foreground">
              Authoring works end to end. Evaluation happens on the backend so
              rules can fire on schedules and server-side events — enabling a
              rule here marks it ready for when that's connected.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {rules.filter((r) => r.enabled).length} of {rules.length} enabled
          </p>
          <Button size="sm" onClick={handleCreate}>
            <Plus />
            New rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Workflow className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">No rules yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Automate repetitive work — assign new leads, create follow-up
              tasks, or notify owners when records go stale.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="flex flex-col rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/automations/${rule.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {rule.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {rule.description || "No description"}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => dispatch(ruleToggled(rule.id))}
                    aria-label={`Enable ${rule.name}`}
                  />
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {triggerSummary(rule)}
                    {rule.conditions.length > 0 &&
                      ` · ${rule.conditions.length} condition${rule.conditions.length === 1 ? "" : "s"}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.actions.length === 0 ? (
                      <span className="text-xs text-warning-strong">
                        No actions configured
                      </span>
                    ) : (
                      rule.actions.map((a) => (
                        <Badge key={a.id} variant="accent" className="gap-1">
                          <Zap />
                          {actionMeta(a.type)?.label ?? a.type}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(rule.updatedAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? "success" : "muted"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${rule.name}`}
                      onClick={() => setPendingDelete(rule)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </MainContentWrapper>

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(ruleRemoved(pendingDelete.id))
        }}
        title="Delete rule"
        description={`Delete "${pendingDelete?.name}"? This cannot be undone.`}
      />
    </>
  )
}

export default Automations
