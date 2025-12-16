import type { ReactNode } from "react";

import { Surface } from "@/components/Surface";

type DashedStatItemProps = {
  label: ReactNode;
  value: ReactNode;
};

export function DashedStatItem({ label, value }: DashedStatItemProps) {
  return (
    <Surface
      as="li"
      variant="panelAlt"
      radius="xl"
      borderStyle="dashed"
      className="px-4 py-3"
    >
      <span className="font-semibold">{label}:</span> {value}
    </Surface>
  );
}

export default DashedStatItem;
