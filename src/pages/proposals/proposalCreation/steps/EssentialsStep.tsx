import type React from "react";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import type { ProposalDraftForm } from "../types";

export function EssentialsStep(props: {
  attemptedNext: boolean;
  chamberOptions: { value: string; label: string }[];
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  textareaClassName: string;
}) {
  const { attemptedNext, chamberOptions, draft, setDraft, textareaClassName } =
    props;

  return (
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
            <p className="text-xs text-destructive">Title is required.</p>
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
    </div>
  );
}
