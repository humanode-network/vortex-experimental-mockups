import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Button } from "@/components/primitives/button";
import { Tabs } from "@/components/primitives/tabs";
import { PageHint } from "@/components/PageHint";
import { Select } from "@/components/primitives/select";
import { chambers } from "@/data/mock/chambers";

type StepKey = "essentials" | "plan" | "budget" | "review";

type TimelineItem = {
  id: string;
  title: string;
  timeframe: string;
};

type LinkItem = {
  id: string;
  label: string;
  url: string;
};

type BudgetItem = {
  id: string;
  description: string;
  amount: string;
};

type ProposalDraftForm = {
  title: string;
  chamberId: string;
  summary: string;
  what: string;
  why: string;
  how: string;
  timeline: TimelineItem[];
  outputs: LinkItem[];
  budgetItems: BudgetItem[];
  aboutMe: string;
  attachments: LinkItem[];
  agreeRules: boolean;
  confirmBudget: boolean;
};

const STORAGE_KEY = "vortex:proposalCreation:draft";
const STORAGE_STEP_KEY = "vortex:proposalCreation:step";

const DEFAULT_DRAFT: ProposalDraftForm = {
  title: "",
  chamberId: "",
  summary: "",
  what: "",
  why: "",
  how: "",
  timeline: [
    { id: "ms-1", title: "Milestone 1", timeframe: "2 weeks" },
    { id: "ms-2", title: "Milestone 2", timeframe: "1 month" },
  ],
  outputs: [{ id: "out-1", label: "Public update", url: "" }],
  budgetItems: [{ id: "b-1", description: "Work package", amount: "" }],
  aboutMe: "",
  attachments: [],
  agreeRules: false,
  confirmBudget: false,
};

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function loadDraft(): ProposalDraftForm {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<ProposalDraftForm>;
    const legacyChamber = (parsed as { chamber?: unknown }).chamber;
    const chamberId =
      typeof parsed.chamberId === "string"
        ? parsed.chamberId
        : typeof legacyChamber === "string"
          ? (chambers.find((c) => c.id === legacyChamber)?.id ??
            chambers.find(
              (c) => c.name.toLowerCase() === legacyChamber.toLowerCase(),
            )?.id ??
            "")
          : "";
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
      chamberId,
      timeline: Array.isArray(parsed.timeline)
        ? parsed.timeline.filter(Boolean)
        : DEFAULT_DRAFT.timeline,
      outputs: Array.isArray(parsed.outputs)
        ? parsed.outputs.filter(Boolean)
        : DEFAULT_DRAFT.outputs,
      budgetItems: Array.isArray(parsed.budgetItems)
        ? parsed.budgetItems.filter(Boolean)
        : DEFAULT_DRAFT.budgetItems,
      attachments: Array.isArray(parsed.attachments)
        ? parsed.attachments.filter(Boolean)
        : DEFAULT_DRAFT.attachments,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

function loadStep(): StepKey {
  const raw = localStorage.getItem(STORAGE_STEP_KEY);
  if (raw === "essentials" || raw === "plan" || raw === "budget") return raw;
  return "review";
}

function isStepKey(value: string): value is StepKey {
  return value === "essentials" || value === "plan" || value === "budget";
}

const ProposalCreation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<ProposalDraftForm>(() => loadDraft());
  const [submitted, setSubmitted] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [draft]);

  const stepParam = (searchParams.get("step") ?? "").trim();
  const desiredStep: StepKey =
    stepParam === "review"
      ? "review"
      : isStepKey(stepParam)
        ? stepParam
        : loadStep();

  const budgetTotal = useMemo(() => {
    return draft.budgetItems.reduce((sum, item) => {
      const n = Number(item.amount);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);
  }, [draft.budgetItems]);

  const essentialsValid =
    draft.title.trim().length > 0 &&
    draft.what.trim().length > 0 &&
    draft.why.trim().length > 0;
  const planValid = draft.how.trim().length > 0;
  const budgetValid =
    draft.budgetItems.some(
      (item) =>
        item.description.trim().length > 0 &&
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) > 0,
    ) && budgetTotal > 0;

  const step: StepKey = desiredStep;

  const chamberOptions = useMemo(() => {
    return [...chambers]
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((chamber) => ({ value: chamber.id, label: chamber.name }));
  }, []);

  const selectedChamber = useMemo(() => {
    return chambers.find((c) => c.id === draft.chamberId) ?? null;
  }, [draft.chamberId]);

  useEffect(() => {
    setSearchParams({ step }, { replace: true });
  }, [step, setSearchParams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STEP_KEY, step);
  }, [step]);

  const stepLabel: Record<StepKey, string> = {
    essentials: "Essentials",
    plan: "Plan",
    budget: "Budget",
    review: "Review",
  };

  const textareaClassName =
    "w-full rounded-xl border border-border bg-panel-alt px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

  const goToStep = (next: StepKey) => {
    setAttemptedNext(false);
    setSearchParams({ step: next }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onNext = () => {
    setAttemptedNext(true);
    if (step === "essentials" && essentialsValid) return goToStep("plan");
    if (step === "plan" && planValid) return goToStep("budget");
    if (step === "budget" && budgetValid) return goToStep("review");
  };

  const onBack = () => {
    setAttemptedNext(false);
    if (step === "review") return goToStep("budget");
    if (step === "budget") return goToStep("plan");
    if (step === "plan") return goToStep("essentials");
    navigate("/app/proposals");
  };

  const resetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    setDraft(DEFAULT_DRAFT);
    setSubmitted(false);
    setAttemptedNext(false);
    setSavedAt(null);
    setSearchParams({ step: "essentials" }, { replace: true });
  };

  const saveDraftNow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    localStorage.setItem(STORAGE_STEP_KEY, step);
    setSavedAt(Date.now());
  };

  const canSubmit =
    essentialsValid &&
    planValid &&
    budgetValid &&
    draft.agreeRules &&
    draft.confirmBudget;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/proposals">Back to proposals</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={saveDraftNow}>
            Save draft
          </Button>
          <Button variant="ghost" size="sm" onClick={resetDraft}>
            Reset draft
          </Button>
          {savedAt ? (
            <span className="text-xs text-muted">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        <Tabs
          value={step}
          onValueChange={(value) => {
            if (!isStepKey(value) && value !== "review") return;
            goToStep(value as StepKey);
          }}
          options={[
            { value: "essentials", label: "1 · Essentials" },
            { value: "plan", label: "2 · Plan" },
            { value: "budget", label: "3 · Budget" },
            { value: "review", label: "4 · Review" },
          ]}
          className="w-full max-w-xl justify-between"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-text">
            Create proposal · {stepLabel[step]}
          </CardTitle>
          <p className="text-sm text-muted">
            This is a UI mockup. Changes autosave locally.
          </p>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4 text-sm text-text">
            <div className="rounded-xl border border-border bg-panel-alt p-4">
              <p className="text-base font-semibold text-text">
                Submitted (mock)
              </p>
              <p className="mt-1 text-sm text-muted">
                No backend yet — this just confirms the flow and the required
                fields.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={resetDraft}>
                Create another
              </Button>
              <Button asChild>
                <Link to="/app/proposals">Back to proposals</Link>
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-5 text-sm text-text">
            {step === "essentials" ? (
              <div className="space-y-5">
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
                      <p className="text-xs text-[var(--destructive)]">
                        Title is required.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="chamber">Chamber (optional)</Label>
                    <Select
                      id="chamber"
                      value={draft.chamberId}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          chamberId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select a chamber…</option>
                      {chamberOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

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
                    <p className="text-xs text-[var(--destructive)]">
                      “What” is required.
                    </p>
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
                    <p className="text-xs text-[var(--destructive)]">
                      “Why” is required.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === "plan" ? (
              <div className="space-y-5">
                <div className="space-y-1">
                  <Label htmlFor="how">How (execution plan) *</Label>
                  <textarea
                    id="how"
                    rows={6}
                    className={textareaClassName}
                    value={draft.how}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, how: e.target.value }))
                    }
                    placeholder="Execution plan: steps, responsibilities, risks, checkpoints."
                  />
                  {attemptedNext && draft.how.trim().length === 0 ? (
                    <p className="text-xs text-[var(--destructive)]">
                      Execution plan is required.
                    </p>
                  ) : null}
                </div>

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
              </div>
            ) : null}

            {step === "budget" ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">How much</p>
                    <p className="text-xs text-muted">
                      Add budget line items and a realistic total.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        budgetItems: [
                          ...prev.budgetItems,
                          { id: newId("b"), description: "", amount: "" },
                        ],
                      }))
                    }
                  >
                    Add item
                  </Button>
                </div>

                <div className="space-y-2">
                  {draft.budgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[1fr_180px_auto]"
                    >
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            budgetItems: prev.budgetItems.map((row) =>
                              row.id === item.id
                                ? { ...row, description: e.target.value }
                                : row,
                            ),
                          }))
                        }
                        placeholder="Line item description"
                      />
                      <Input
                        value={item.amount}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            budgetItems: prev.budgetItems.map((row) =>
                              row.id === item.id
                                ? { ...row, amount: e.target.value }
                                : row,
                            ),
                          }))
                        }
                        inputMode="decimal"
                        placeholder="Amount (HMND)"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            budgetItems: prev.budgetItems.filter(
                              (row) => row.id !== item.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-panel-alt px-4 py-3">
                  <p className="text-sm font-semibold text-text">Total</p>
                  <p className="text-lg font-semibold text-text">
                    {budgetTotal.toLocaleString()} HMND
                  </p>
                </div>

                {attemptedNext && !budgetValid ? (
                  <p className="text-xs text-[var(--destructive)]">
                    Add at least one budget line item with a positive amount.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === "review" ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-panel-alt p-4">
                  <p className="text-sm font-semibold text-text">
                    Who (auto-filled)
                  </p>
                  <div className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <div>
                      <span className="text-text">Name</span>: Humanode Governor
                      (mock)
                    </div>
                    <div>
                      <span className="text-text">Handle</span>: @governor_42
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label htmlFor="about">
                      Tell about yourself (optional)
                    </Label>
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
                                {ms.timeframe.trim().length > 0
                                  ? ms.timeframe
                                  : "—"}
                                )
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text">
                          Budget
                        </p>
                        <p className="text-muted">
                          Total: {budgetTotal.toLocaleString()} HMND
                        </p>
                      </div>
                    </div>
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
                      Add links to PDFs, docs, spreadsheets, or any supporting
                      material.
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
                        className="h-4 w-4 accent-[var(--primary)]"
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
                        className="h-4 w-4 accent-[var(--primary)]"
                        checked={draft.confirmBudget}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            confirmBudget: e.target.checked,
                          }))
                        }
                      />
                      I confirm the budget is accurate
                    </label>
                  </div>
                  {!canSubmit ? (
                    <p className="text-xs text-muted">
                      You can navigate steps freely. Submit unlocks once
                      required fields are filled and both checkboxes are
                      checked.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button variant="ghost" onClick={onBack}>
                {step === "essentials" ? "Cancel" : "Back"}
              </Button>
              <div className="flex items-center gap-2">
                {step === "review" ? (
                  <Button
                    disabled={!canSubmit}
                    onClick={() => setSubmitted(true)}
                  >
                    Submit proposal (mock)
                  </Button>
                ) : (
                  <Button onClick={onNext}>Next</Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ProposalCreation;
