import type React from "react";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import type { ProposalDraftForm } from "../types";
import {
  SYSTEM_ACTIONS,
  getSystemActionMeta,
  type SystemActionId,
} from "../templates/systemActions";

type MetaGovernanceDraft = NonNullable<ProposalDraftForm["metaGovernance"]>;

export function EssentialsStep(props: {
  attemptedNext: boolean;
  chamberOptions: { value: string; label: string }[];
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  templateId: "project" | "system";
  setTemplateId: (templateId: "project" | "system") => void;
  textareaClassName: string;
}) {
  const {
    attemptedNext,
    chamberOptions,
    draft,
    setDraft,
    templateId,
    setTemplateId,
    textareaClassName,
  } = props;

  const isSystemProposal = templateId === "system";
  const hasGeneralOption = chamberOptions.some(
    (opt) => opt.value === "general",
  );
  const systemAction = draft.metaGovernance?.action as
    | SystemActionId
    | undefined;
  const systemActionMeta = getSystemActionMeta(systemAction);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="proposal-kind">Kind</Label>
        <Select
          id="proposal-kind"
          value={templateId}
          onChange={(e) => {
            const next = e.target.value as "project" | "system";
            setTemplateId(next);
            setDraft((prev) => {
              if (next === "system") {
                const nextMeta: MetaGovernanceDraft = {
                  action: "chamber.create",
                  chamberId: "",
                  title: "",
                  multiplier: undefined,
                  genesisMembers: [],
                };
                return {
                  ...prev,
                  chamberId: "general",
                  metaGovernance: nextMeta,
                };
              }
              return { ...prev, metaGovernance: undefined };
            });
          }}
        >
          <option value="project">Project proposal</option>
          <option value="system">System change (General)</option>
        </Select>
        <p className="text-xs text-muted">
          System changes affect simulation variables directly (e.g., chamber
          creation). Project proposals describe work outside the system.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Proposal title"
          />
          {attemptedNext && draft.title.trim().length === 0 ? (
            <p className="text-xs text-destructive">Title is required.</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="chamber">
            {isSystemProposal ? "Chamber" : "Chamber (optional)"}
          </Label>
          <Select
            id="chamber"
            value={isSystemProposal ? "general" : draft.chamberId}
            disabled={isSystemProposal}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                chamberId: e.target.value,
              }))
            }
          >
            <option value="">Select a chamber…</option>
            {!hasGeneralOption ? (
              <option value="general">General chamber</option>
            ) : null}
            {chamberOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {isSystemProposal ? (
            <p className="text-xs text-muted">
              System proposals must target General chamber.
            </p>
          ) : null}
        </div>
      </div>

      {isSystemProposal ? (
        <div className="space-y-3 rounded-xl border border-border bg-panel-alt p-4">
          <p className="text-sm font-semibold text-text">System change</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="system-action">Action</Label>
              <Select
                id="system-action"
                value={draft.metaGovernance?.action ?? "chamber.create"}
                onChange={(e) => {
                  const action = e.target
                    .value as MetaGovernanceDraft["action"];
                  setDraft((prev) => ({
                    ...prev,
                    metaGovernance: {
                      ...(prev.metaGovernance ?? {
                        action,
                        chamberId: "",
                        title: "",
                        genesisMembers: [],
                      }),
                      action,
                    },
                    chamberId: "general",
                  }));
                }}
              >
                {Object.entries(SYSTEM_ACTIONS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted">
                {systemActionMeta.description}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="target-chamber-id">Target chamber id *</Label>
              <Input
                id="target-chamber-id"
                value={draft.metaGovernance?.chamberId ?? ""}
                onChange={(e) => {
                  const chamberId = e.target.value;
                  setDraft((prev) => ({
                    ...prev,
                    metaGovernance: {
                      ...(prev.metaGovernance ?? {
                        action: "chamber.create",
                        chamberId: "",
                        title: "",
                        genesisMembers: [],
                      }),
                      chamberId,
                    },
                    chamberId: "general",
                  }));
                }}
                placeholder="e.g., engineering"
              />
              {attemptedNext &&
              (draft.metaGovernance?.chamberId ?? "").trim().length === 0 ? (
                <p className="text-xs text-destructive">
                  Target chamber id is required.
                </p>
              ) : null}
            </div>
          </div>

          {systemActionMeta.requiresTitle ||
          systemActionMeta.showMultiplier ||
          systemActionMeta.showGenesisMembers ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {systemActionMeta.requiresTitle ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-title">Title *</Label>
                    <Input
                      id="target-title"
                      value={draft.metaGovernance?.title ?? ""}
                      onChange={(e) => {
                        const title = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            title,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="Engineering chamber"
                    />
                    {attemptedNext &&
                    (draft.metaGovernance?.title ?? "").trim().length === 0 ? (
                      <p className="text-xs text-destructive">
                        Title is required for chamber creation.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {systemActionMeta.showMultiplier ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-multiplier">
                      Multiplier (optional)
                    </Label>
                    <Input
                      id="target-multiplier"
                      value={
                        draft.metaGovernance?.multiplier === undefined ||
                        draft.metaGovernance?.multiplier === null
                          ? ""
                          : String(draft.metaGovernance.multiplier)
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const multiplier =
                          raw.length === 0 ? undefined : Number(raw);
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            multiplier:
                              multiplier === undefined ||
                              Number.isNaN(multiplier)
                                ? undefined
                                : multiplier,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="e.g., 3"
                      inputMode="decimal"
                    />
                  </div>
                ) : null}
              </div>
              {systemActionMeta.showGenesisMembers ? (
                <div className="space-y-1">
                  <Label htmlFor="genesis-members">
                    Genesis members (optional, one address per line)
                  </Label>
                  <textarea
                    id="genesis-members"
                    rows={4}
                    className={textareaClassName}
                    value={(draft.metaGovernance?.genesisMembers ?? []).join(
                      "\n",
                    )}
                    onChange={(e) => {
                      const genesisMembers = e.target.value
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean);
                      setDraft((prev) => ({
                        ...prev,
                        metaGovernance: {
                          ...(prev.metaGovernance ?? {
                            action: "chamber.create",
                            chamberId: "",
                            title: "",
                            genesisMembers: [],
                          }),
                          genesisMembers,
                        },
                        chamberId: "general",
                      }));
                    }}
                    placeholder={"5F...Alice\n5F...Bob"}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="summary">Summary (optional)</Label>
        <Input
          id="summary"
          value={draft.summary}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, summary: e.target.value }))
          }
          placeholder="One line used in lists/cards"
        />
      </div>

      {isSystemProposal ? null : (
        <>
          <div className="space-y-1">
            <Label htmlFor="what">What *</Label>
            <textarea
              id="what"
              rows={5}
              className={textareaClassName}
              value={draft.what}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, what: e.target.value }))
              }
              placeholder="Describe the project/task you want to execute."
            />
            {attemptedNext && draft.what.trim().length === 0 ? (
              <p className="text-xs text-destructive">“What” is required.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="why">Why *</Label>
            <textarea
              id="why"
              rows={5}
              className={textareaClassName}
              value={draft.why}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, why: e.target.value }))
              }
              placeholder="Explain the expected contribution to Humanode."
            />
            {attemptedNext && draft.why.trim().length === 0 ? (
              <p className="text-xs text-destructive">“Why” is required.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
