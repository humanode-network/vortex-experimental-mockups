import type React from "react";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { newId } from "../ids";
import type { ProposalDraftForm } from "../types";

export function PlanStep(props: {
  attemptedNext: boolean;
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  mode: "project" | "system";
  textareaClassName: string;
}) {
  const { attemptedNext, draft, setDraft, mode, textareaClassName } = props;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="how">
          {mode === "system"
            ? "How (implementation) *"
            : "How (execution plan) *"}
        </Label>
        <textarea
          id="how"
          rows={6}
          className={textareaClassName}
          value={draft.how}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, how: e.target.value }))
          }
          placeholder={
            mode === "system"
              ? "Explain how the system change should be applied and verified."
              : "Execution plan: steps, responsibilities, risks, checkpoints."
          }
        />
        {attemptedNext && draft.how.trim().length === 0 ? (
          <p className="text-xs text-destructive">
            {mode === "system"
              ? "Implementation notes are required."
              : "Execution plan is required."}
          </p>
        ) : null}
      </div>

      {mode === "system" ? null : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text">When</p>
                <p className="text-xs text-muted">
                  Timeline is recommended (milestones).
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    timeline: [
                      ...prev.timeline,
                      { id: newId("ms"), title: "", timeframe: "" },
                    ],
                  }))
                }
              >
                Add milestone
              </Button>
            </div>
            <div className="space-y-2">
              {draft.timeline.map((ms) => (
                <div
                  key={ms.id}
                  className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[1fr_200px_auto]"
                >
                  <Input
                    value={ms.title}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        timeline: prev.timeline.map((item) =>
                          item.id === ms.id
                            ? { ...item, title: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    placeholder="Milestone title"
                  />
                  <Input
                    value={ms.timeframe}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        timeline: prev.timeline.map((item) =>
                          item.id === ms.id
                            ? { ...item, timeframe: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    placeholder="Timeframe (e.g., 2 weeks)"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        timeline: prev.timeline.filter(
                          (item) => item.id !== ms.id,
                        ),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text">Where</p>
                <p className="text-xs text-muted">
                  Links to platforms or public outcomes (optional).
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    outputs: [
                      ...prev.outputs,
                      { id: newId("out"), label: "", url: "" },
                    ],
                  }))
                }
              >
                Add link
              </Button>
            </div>
            <div className="space-y-2">
              {draft.outputs.map((out) => (
                <div
                  key={out.id}
                  className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[220px_1fr_auto]"
                >
                  <Input
                    value={out.label}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.map((item) =>
                          item.id === out.id
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    placeholder="Label (e.g., GitHub, Notion)"
                  />
                  <Input
                    value={out.url}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.map((item) =>
                          item.id === out.id
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
                        outputs: prev.outputs.filter(
                          (item) => item.id !== out.id,
                        ),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
