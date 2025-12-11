import type { ChangeEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  ariaLabel?: string;
  rightContent?: ReactNode;
  className?: string;
  inputClassName?: string;
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
}) => {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3",
        className,
      )}
    >
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className={cn("flex-1", inputClassName)}
      />
      {rightContent ? (
        <div className="flex items-center gap-2">{rightContent}</div>
      ) : null}
    </div>
  );
};

export default SearchBar;
