import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiChambers } from "@/lib/apiClient";
import type { ChamberDto } from "@/types/api";

const CMPanel: React.FC = () => {
  const [chambers, setChambers] = useState<Array<
    Pick<ChamberDto, "id" | "name" | "multiplier"> & {
      current: number;
      suggested: number;
      member: boolean;
    }
  > | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiChambers();
        if (!active) return;
        setChambers(
          res.items.map((chamber) => ({
            id: chamber.id,
            name: chamber.name,
            multiplier: chamber.multiplier,
            current: chamber.multiplier,
            suggested: chamber.multiplier,
            member: chamber.id === "engineering" || chamber.id === "product",
          })),
        );
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setChambers([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateSuggestion = (id: string, value: number) => {
    setChambers((prev) =>
      prev
        ? prev.map((c) => (c.id === id ? { ...c, suggested: value } : c))
        : prev,
    );
  };

  const nonMemberSuggestions = (chambers ?? []).filter((c) => !c.member);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="cm-panel" />
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          CM panel unavailable: {loadError}
        </Card>
      ) : null}
      {chambers === null && !loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading chambers…
        </Card>
      ) : null}
      {chambers !== null && chambers.length === 0 && !loadError ? (
        <NoDataYetBar label="chambers" />
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Set your <HintLabel termId="cognitocratic_measure">CM</HintLabel>{" "}
          multipliers for chambers you are not a member of. Chambers you belong
          to are blurred and not adjustable here.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(chambers ?? []).map((chamber) => (
            <Surface
              key={chamber.id}
              variant="panelAlt"
              className={`relative px-4 py-3 ${chamber.member ? "opacity-50" : ""}`}
            >
              {chamber.member && (
                <div className="absolute inset-0 rounded-2xl bg-panel-alt/60 backdrop-blur-sm" />
              )}
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text">
                    {chamber.name}
                  </p>
                  <Badge variant="outline">M × {chamber.current}</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted">
                  <p>Your suggestion</p>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3"
                    disabled={chamber.member}
                    value={chamber.suggested}
                    onChange={(e) =>
                      updateSuggestion(chamber.id, Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                {chamber.member && (
                  <p className="text-xs text-muted">
                    You cannot set M for chambers you belong to.
                  </p>
                )}
              </div>
            </Surface>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" disabled={nonMemberSuggestions.length === 0}>
          Submit suggestions
        </Button>
      </div>
    </div>
  );
};

export default CMPanel;
