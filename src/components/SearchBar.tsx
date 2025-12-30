import type {
  ChangeEventHandler,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";
import { Select } from "@/components/primitives/select";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";

type FiltersConfigField<TFilters extends Record<string, string>> = {
  key: keyof TFilters & string;
  label: string;
  options: { value: string; label: string }[];
};

type SearchBarProps<TFilters extends Record<string, string>> = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  ariaLabel?: string;
  rightContent?: ReactNode;
  className?: string;
  inputClassName?: string;
  filtersContent?: ReactNode;
  filtersConfig?: FiltersConfigField<TFilters>[];
  filtersState?: TFilters;
  onFiltersChange?: Dispatch<SetStateAction<TFilters>>;
  onApplyFilters?: () => void;
};

/**
 * Reusable search bar that matches the unified Factions-style search row.
 * Keeps the layout consistent across pages and allows optional right-side content
 * (page hints, buttons, etc.).
 */
export function SearchBar<
  TFilters extends Record<string, string> = Record<string, string>,
>({
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
}: SearchBarProps<TFilters>) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const content =
    filtersContent ||
    (filtersConfig ? (
      <div className="space-y-3">
        {filtersConfig.map((field) => (
          <div key={field.key} className="space-y-1">
            <Kicker>{field.label}</Kicker>
            <Select
              className="w-full"
              value={filtersState?.[field.key] ?? field.options[0]?.value ?? ""}
              onChange={(e) => {
                const current = (filtersState ?? {}) as TFilters;
                const next = {
                  ...current,
                  [field.key]: e.target.value,
                } as TFilters;
                onFiltersChange?.(next);
              }}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
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
          className={cn(
            "w-full border border-border bg-panel-alt text-text",
            inputClassName,
          )}
        />
        {filtersOpen ? (
          <Surface
            variant="panel"
            radius="2xl"
            shadow="popover"
            className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 w-full border-(--primary-dim) p-4"
          >
            <div className="space-y-3 text-sm text-text">{content}</div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                className="border border-accent bg-panel text-accent hover:bg-accent hover:text-accent-foreground"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onApplyFilters?.();
                  setFiltersOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </Surface>
        ) : null}
      </div>
      {rightContent ? (
        <div className="flex items-center gap-2">{rightContent}</div>
      ) : null}
    </div>
  );
}
