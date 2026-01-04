import type React from "react";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { newId } from "../ids";
import type { ProposalDraftForm } from "../types";
import type { ChamberDto } from "@/types/api";

export function ReviewStep(props: {
  budgetTotal: number;
  canAct: boolean;
  canSubmit: boolean;
  draft: ProposalDraftForm;
  mode: "project" | "system";
  selectedChamber: ChamberDto | null;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  textareaClassName: string;
}) {
  const {
    budgetTotal,
    canAct,
    canSubmit,
    draft,
    mode,
    selectedChamber,
    setDraft,
    textareaClassName,
  } = props;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-panel-alt p-4">
        <p className="text-sm font-semibold text-text">Who (auto-filled)</p>
        <div className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <div>
            <span className="text-text">Name</span>: Humanode Governor (mock)
          </div>
          <div>
            <span className="text-text">Handle</span>: @governor_42
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Label htmlFor="about">Tell about yourself (optional)</Label>
          <textarea
            id="about"
            rows={3}
            className={textareaClassName}
            value={draft.aboutMe}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                aboutMe: e.target.value,
              }))
            }
            placeholder="Short intro / credentials / relevant experience."
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel-alt p-4">
        <p className="text-sm font-semibold text-text">Preview</p>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-text">{draft.title}</p>
            {draft.summary.trim().length > 0 ? (
              <p className="text-muted">{draft.summary}</p>
            ) : null}
            {selectedChamber ? (
              <p className="mt-1 text-xs text-muted">
                Chamber: {selectedChamber.name}
              </p>
            ) : null}
          </div>
          {mode === "system" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-text">Action</p>
                  <p className="text-muted">
                    {draft.metaGovernance?.action === "chamber.dissolve"
                      ? "Dissolve chamber"
                      : "Create chamber"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">
                    Target chamber id
                  </p>
                  <p className="text-muted">
                    {draft.metaGovernance?.chamberId ?? "—"}
                  </p>
                </div>
              </div>
              {draft.metaGovernance?.action === "chamber.create" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-text">
                      Chamber name
                    </p>
                    <p className="text-muted">
                      {draft.metaGovernance?.title ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">
                      Multiplier
                    </p>
                    <p className="text-muted">
                      {draft.metaGovernance?.multiplier ?? "—"}
                    </p>
                  </div>
                </div>
              ) : null}
              {draft.metaGovernance?.action === "chamber.create" ? (
                <div>
                  <p className="text-xs font-semibold text-text">
                    Genesis members
                  </p>
                  <p className="text-muted">
                    {(draft.metaGovernance?.genesisMembers ?? []).length > 0
                      ? draft.metaGovernance?.genesisMembers?.join(", ")
                      : "—"}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold text-text">
                  Implementation notes
                </p>
                <p className="text-muted">{draft.how}</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-text">What</p>
                  <p className="text-muted">{draft.what}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">Why</p>
                  <p className="text-muted">{draft.why}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text">How</p>
                <p className="text-muted">{draft.how}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-text">When</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                    {draft.timeline.length === 0 ? (
                      <li>No milestones added.</li>
                    ) : (
                      draft.timeline.map((ms) => (
                        <li key={ms.id}>
                          {ms.title.trim().length > 0 ? ms.title : "—"} (
                          {ms.timeframe.trim().length > 0 ? ms.timeframe : "—"})
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text">Budget</p>
                  <p className="text-muted">
                    Total: {budgetTotal.toLocaleString()} HMND
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-panel-alt p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-text">
            Attachments (optional, recommended)
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                attachments: [
                  ...prev.attachments,
                  { id: newId("att"), label: "", url: "" },
                ],
              }))
            }
          >
            Add link
          </Button>
        </div>
        {draft.attachments.length === 0 ? (
          <p className="text-xs text-muted">
            Add links to PDFs, docs, spreadsheets, or any supporting material.
          </p>
        ) : (
          <div className="space-y-2">
            {draft.attachments.map((att) => (
              <div
                key={att.id}
                className="grid gap-2 sm:grid-cols-[220px_1fr_auto]"
              >
                <Input
                  value={att.label}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      attachments: prev.attachments.map((item) =>
                        item.id === att.id
                          ? { ...item, label: e.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="Label"
                />
                <Input
                  value={att.url}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      attachments: prev.attachments.map((item) =>
                        item.id === att.id
                          ? { ...item, url: e.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="https://…"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      attachments: prev.attachments.filter(
                        (item) => item.id !== att.id,
                      ),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-panel-alt p-4">
        <p className="text-sm font-semibold text-text">Rules</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Be specific about outcomes and deliverables.</li>
          <li>Use a realistic timeline and budget.</li>
          <li>No personal data; keep it governance-safe.</li>
          <li>Attachments are optional but recommended.</li>
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-text">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={draft.agreeRules}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  agreeRules: e.target.checked,
                }))
              }
            />
            I agree to the rules
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-text">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={draft.confirmBudget}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  confirmBudget: e.target.checked,
                }))
              }
            />
            {mode === "system"
              ? "I confirm the proposal details are accurate"
              : "I confirm the budget is accurate"}
          </label>
        </div>
        {!canSubmit ? (
          <p className="text-xs text-muted">
            You can navigate steps freely. Submit unlocks once required fields
            are filled and both checkboxes are checked.
          </p>
        ) : null}
        {SIM_AUTH_ENABLED && !canAct ? (
          <p className="text-xs text-muted">
            Submitting is available only to eligible human nodes.
          </p>
        ) : null}
      </div>
    </div>
  );
}
