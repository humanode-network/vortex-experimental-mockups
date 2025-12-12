import type { ChangeEventHandler, ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  ariaLabel?: string;
  rightContent?: ReactNode;
  className?: string;
  inputClassName?: string;
  filtersContent?: ReactNode;
  filtersConfig?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  filtersState?: Record<string, string>;
  onFiltersChange?: (next: Record<string, string>) => void;
  onApplyFilters?: () => void;
};

/**
 * Reusable search bar that matches the unified Factions-style search row.
 * Keeps the layout consistent across pages and allows optional right-side content
 * (page hints, buttons, etc.).
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  rightContent,
  className,
  inputClassName,
  filtersContent,
  filtersConfig,
  filtersState,
  onFiltersChange,
  onApplyFilters,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const content =
    filtersContent ||
    (filtersConfig ? (
      <div className="space-y-3">
        {filtersConfig.map((field) => (
          <div key={field.key} className="space-y-1">
            <p className="text-xs tracking-wide text-muted uppercase">
              {field.label}
            </p>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={
                filtersState?.[field.key] ?? field.options[0]?.value ?? ""
              }
              onChange={(e) => {
                const next = {
                  ...filtersState,
                  [field.key]: e.target.value,
                };
                onFiltersChange?.(next);
              }}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    ) : (
      "Filters are not configured for this search yet."
    ));

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-between gap-3",
        className,
      )}
    >
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          onFocus={() => setFiltersOpen(true)}
          onClick={() => setFiltersOpen(true)}
          className={cn("w-full", inputClassName)}
        />
        {filtersOpen ? (
          <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 w-full rounded-2xl border border-border bg-white p-4 shadow-xl">
            <div className="space-y-3 text-sm text-(--text)">{content}</div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onApplyFilters?.();
                  setFiltersOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {rightContent ? (
        <div className="flex items-center gap-2">{rightContent}</div>
      ) : null}
    </div>
  );
};

export default SearchBar;
