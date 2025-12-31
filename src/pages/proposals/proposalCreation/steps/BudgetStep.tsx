import type React from "react";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { newId } from "../ids";
import type { ProposalDraftForm } from "../types";

export function BudgetStep(props: {
  attemptedNext: boolean;
  budgetTotal: number;
  budgetValid: boolean;
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
}) {
  const { attemptedNext, budgetTotal, budgetValid, draft, setDraft } = props;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text">How much</p>
            <p className="text-xs text-muted">
              Detailed budget items (required to submit).
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
            Add line item
          </Button>
        </div>
        <div className="space-y-2">
          {draft.budgetItems.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-xl border border-border bg-panel-alt p-3 sm:grid-cols-[1fr_160px_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted">Description</Label>
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
                  placeholder="Work package, audit, design…"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted">HMND</Label>
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
                  placeholder="0"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="self-end"
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
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-panel-alt px-4 py-3">
        <p className="text-sm font-semibold text-text">Total</p>
        <p className="text-lg font-semibold text-text">
          {budgetTotal.toLocaleString()} HMND
        </p>
      </div>

      {attemptedNext && !budgetValid ? (
        <p className="text-xs text-destructive">
          Add at least one budget line item with a positive amount.
        </p>
      ) : null}
    </div>
  );
}
