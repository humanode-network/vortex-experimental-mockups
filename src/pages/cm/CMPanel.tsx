import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AppPage } from "@/components/AppPage";

const CMPanel: React.FC = () => {
  const initialChambers = [
    {
      id: "protocol",
      name: "Protocol Engineering",
      current: 1.5,
      suggested: 1.5,
      member: true,
    },
    {
      id: "research",
      name: "Research & Cryptobiometrics",
      current: 1.8,
      suggested: 1.8,
      member: false,
    },
    {
      id: "treasury",
      name: "Treasury & Economics",
      current: 1.3,
      suggested: 1.3,
      member: false,
    },
    {
      id: "formation",
      name: "Formation Logistics",
      current: 1.2,
      suggested: 1.2,
      member: false,
    },
    {
      id: "social",
      name: "Social Outreach",
      current: 1.1,
      suggested: 1.1,
      member: false,
    },
    {
      id: "security",
      name: "Security Council",
      current: 1.7,
      suggested: 1.7,
      member: true,
    },
  ];

  const [chambers, setChambers] = useState(initialChambers);

  const updateSuggestion = (id: string, value: number) => {
    setChambers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, suggested: value } : c)),
    );
  };

  const nonMemberSuggestions = chambers.filter((c) => !c.member);

  return (
    <AppPage pageId="cm-panel">
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
    </AppPage>
  );
};

export default CMPanel;
