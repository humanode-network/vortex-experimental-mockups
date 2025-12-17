import { useState } from "react";
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
import { chambers as chamberDirectory } from "@/data/mock/chambers";

const CMPanel: React.FC = () => {
  const [chambers, setChambers] = useState(
    chamberDirectory.map((chamber) => ({
      id: chamber.id,
      name: chamber.name,
      current: chamber.multiplier,
      suggested: chamber.multiplier,
      member:
        chamber.id === "protocol-engineering" ||
        chamber.id === "security-council",
    })),
  );

  const updateSuggestion = (id: string, value: number) => {
    setChambers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, suggested: value } : c)),
    );
  };

  const nonMemberSuggestions = chambers.filter((c) => !c.member);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="cm-panel" />
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
          {chambers.map((chamber) => (
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
