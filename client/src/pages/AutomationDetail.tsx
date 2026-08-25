import { useEffect, useState } from "react"
import { ArrowLeft, Info, Save } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import RuleBuilder from "@/components/pages/automations/RuleBuilder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchRule,
  selectRuleById,
  selectRulesStatus,
  toggleAutomationRule,
  updateAutomationRule,
  type RuleDraft,
} from "@/store/automationsSlice"
import type { RootState } from "@/store"

const AutomationDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const rule = useAppSelector((s: RootState) => selectRuleById(s, id))
  const status = useAppSelector(selectRulesStatus)
  const [draft, setDraft] = useState<RuleDraft | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (id) dispatch(fetchRule(id))
  }, [dispatch, id])

  useEffect(() => {
    if (!rule) return
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = rule
    setDraft(rest)
  }, [rule])

  if (status === "loading" && !rule) {
    return (
      <MainContentWrapper className="px-8 py-16 text-center text-sm text-muted-foreground">
        Loading rule…
      </MainContentWrapper>
    )
  }

  if (!rule || !draft) {
    return (
      <MainContentWrapper className="px-8 py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Rule not found
          </h2>
          <Button asChild variant="outline">
            <Link to="/automations">
              <ArrowLeft />
              Back to automations
            </Link>
          </Button>
        </div>
      </MainContentWrapper>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setNotice(null)
    try {
      await dispatch(updateAutomationRule({ id: rule.id, changes: draft })).unwrap()
      setNotice("Rule saved")
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to save rule"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (enabled: boolean) => {
    dispatch(toggleAutomationRule({ id: rule.id, enabled }))
  }

  const canSave = draft.name.trim().length > 0

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="flex flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="icon-sm" className="self-start">
            <Link to="/automations" aria-label="Back to automations">
              <ArrowLeft />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {draft.name || "Untitled rule"}
              </h1>
              <Badge variant={rule.enabled ? "success" : "muted"}>
                {rule.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {draft.conditions.length} condition
              {draft.conditions.length === 1 ? "" : "s"} ·{" "}
              {draft.actions.length} action
              {draft.actions.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Enabled
              <Switch
                checked={rule.enabled}
                onCheckedChange={handleToggle}
                aria-label="Enable rule"
              />
            </label>
            <Button size="sm" onClick={handleSave} disabled={!canSave} loading={isSaving}>
              <Save />
              Save
            </Button>
          </div>
        </div>
      </div>

      <MainContentWrapper className="space-y-6 px-8">
        {notice && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-info-soft p-4">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-info-strong" />
              <p className="text-sm text-muted-foreground">{notice}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <RuleBuilder draft={draft} onChange={setDraft} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/automations")}>
            Back
          </Button>
          <Button onClick={handleSave} disabled={!canSave} loading={isSaving}>
            <Save />
            Save rule
          </Button>
        </div>
      </MainContentWrapper>
    </>
  )
}

export default AutomationDetail
