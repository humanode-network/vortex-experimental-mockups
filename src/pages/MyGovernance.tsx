import { Check, X } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { AppCard } from "@/components/AppCard";
import { HintLabel } from "@/components/Hint";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { PipelineList } from "@/components/PipelineList";
import { StatGrid, makeChamberStats } from "@/components/StatGrid";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { apiChambers, apiMyGovernance } from "@/lib/apiClient";
import type { ChamberDto, GetMyGovernanceResponse } from "@/types/api";
import { cn } from "@/lib/utils";

type GoverningStatus =
  | "Ahead"
  | "Stable"
  | "Falling behind"
  | "At risk"
  | "Losing status";

const governingStatusForProgress = (
  completed: number,
  required: number,
): { label: GoverningStatus; termId: string } => {
  if (required <= 0) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  if (completed >= required + 2) {
    return { label: "Ahead", termId: "governing_status_ahead" };
  }

  if (completed >= required) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  const ratio = completed / required;
  if (ratio >= 0.75) {
    return {
      label: "Falling behind",
      termId: "governing_status_falling_behind",
    };
  }
  if (ratio >= 0.55) {
    return { label: "At risk", termId: "governing_status_at_risk" };
  }
  return {
    label: "Losing status",
    termId: "governing_status_losing_status",
  };
};

const governingStatusTermId = (label: GoverningStatus): string => {
  if (label === "Ahead") return "governing_status_ahead";
  if (label === "Stable") return "governing_status_stable";
  if (label === "Falling behind") return "governing_status_falling_behind";
  if (label === "At risk") return "governing_status_at_risk";
  return "governing_status_losing_status";
};

const MyGovernance: React.FC = () => {
  const [gov, setGov] = useState<GetMyGovernanceResponse | null>(null);
  const [chambers, setChambers] = useState<ChamberDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [govRes, chambersRes] = await Promise.all([
          apiMyGovernance(),
          apiChambers(),
        ]);
        if (!active) return;
        setGov(govRes);
        setChambers(chambersRes.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setGov(null);
        setChambers(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const eraActivity = gov?.eraActivity;
  const status: { label: GoverningStatus; termId: string } = gov?.rollup
    ? {
        label: gov.rollup.status,
        termId: governingStatusTermId(gov.rollup.status),
      }
    : governingStatusForProgress(
        eraActivity?.completed ?? 0,
        eraActivity?.required ?? 0,
      );

  const myChambers = useMemo(() => {
    if (!gov || !chambers) return [];
    return chambers.filter((chamber) => gov.myChamberIds.includes(chamber.id));
  }, [gov, chambers]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="my-governance" />
      {gov === null || chambers === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className={cn(
            "px-5 py-4 text-sm text-muted",
            loadError ? "text-destructive" : undefined,
          )}
        >
          {loadError ? `My governance unavailable: ${loadError}` : "Loading…"}
        </Surface>
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            <HintLabel termId="governing_threshold">
              Governing threshold
            </HintLabel>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Era", value: eraActivity?.era ?? "—" },
              { label: "Time left", value: eraActivity?.timeLeft ?? "—" },
            ].map((tile) => (
              <Surface
                key={tile.label}
                variant="panelAlt"
                radius="2xl"
                shadow="tile"
                className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
              >
                <p className="text-sm text-muted">
                  {tile.label === "Era" ? (
                    <HintLabel termId="governing_era">{tile.label}</HintLabel>
                  ) : (
                    tile.label
                  )}
                </p>
                <p className="text-xl font-semibold text-text">{tile.value}</p>
              </Surface>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                key: "required",
                label: (
                  <HintLabel termId="governing_threshold">
                    Required actions
                  </HintLabel>
                ),
                value: eraActivity
                  ? `${eraActivity.completed} / ${eraActivity.required} completed`
                  : "—",
              },
              {
                key: "status",
                label: "Status",
                value: (
                  <HintLabel termId={status.termId}>{status.label}</HintLabel>
                ),
              },
            ].map((tile) => (
              <Surface
                key={tile.key}
                variant="panelAlt"
                radius="2xl"
                shadow="tile"
                className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
              >
                <p className="text-sm text-muted">{tile.label}</p>
                <p className="text-xl font-semibold text-text">{tile.value}</p>
              </Surface>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(eraActivity?.actions ?? []).map((act) => (
              <Surface
                key={act.label}
                variant="panelAlt"
                radius="xl"
                shadow="tile"
                className="flex h-full flex-col items-center justify-center px-3 py-3 text-center"
              >
                <Kicker align="center" className="text-[0.7rem]">
                  {act.label}
                </Kicker>
                <p className="text-base font-semibold text-text">
                  {act.done} / {act.required}
                </p>
              </Surface>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Progression dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4 text-center"
            >
              <Kicker align="center">Current tier</Kicker>
              <p className="text-lg font-semibold text-text">
                <HintLabel termId="tier2_ecclesiast">Ecclesiast</HintLabel>
              </p>
            </Surface>
            <div className="flex flex-col items-center justify-center gap-3 px-2">
              <Kicker align="center">Progress</Kicker>
              <div className="relative h-2 w-48 overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: "68%" }}
                />
              </div>
              <p className="text-sm font-semibold text-text">68% to Legate</p>
            </div>
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4 text-center"
            >
              <Kicker align="center">Next tier</Kicker>
              <p className="text-lg font-semibold text-text">
                <HintLabel termId="tier3_legate">Legate</HintLabel>
              </p>
            </Surface>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <Kicker>Requirements progress</Kicker>
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">
                      Run a node for 1 year
                    </p>
                    <p className="text-sm text-muted">1 Y 204 D</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-text">78%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">
                      Be an active governor for 1 year
                    </p>
                    <p className="text-sm text-muted">1 Y 2 D</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: "50%" }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-text">50%</p>
                </div>
              </div>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <Kicker>Eligibility checklist</Kicker>
              <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-panel/40">
                {[
                  {
                    label: "Have your proposal accepted in Vortex",
                    ok: true,
                  },
                  {
                    label: "Participate in a project through Formation",
                    ok: false,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 px-3 py-3"
                  >
                    <p className="text-sm leading-snug font-semibold text-text">
                      {row.label}
                    </p>
                    <span
                      className={
                        row.ok
                          ? "inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok"
                          : "inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/12 px-2.5 py-1 text-xs font-semibold text-danger"
                      }
                    >
                      {row.ok ? (
                        <Check
                          className="h-3.5 w-3.5 text-ok"
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-3.5 w-3.5 text-danger"
                          aria-hidden="true"
                        />
                      )}
                      {row.ok ? "Done" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-text">
                Proposals available with{" "}
                <HintLabel termId="tier2_ecclesiast">Ecclesiast</HintLabel>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>Basic proposals</li>
                <li>Fee distribution</li>
                <li>Monetary modification</li>
              </ul>
            </Surface>
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-text">
                Proposals available with{" "}
                <HintLabel termId="tier3_legate">Legate</HintLabel>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>Core infrastructure changes</li>
              </ul>
            </Surface>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>My chambers</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myChambers.map((chamber) => (
              <AppCard
                key={chamber.id}
                title={
                  <span className="text-xl font-bold">{chamber.name}</span>
                }
                badge={
                  <Badge
                    size="md"
                    className="border-none bg-(--primary-dim) px-4 py-1 text-center text-sm font-bold tracking-wide whitespace-nowrap text-primary uppercase"
                  >
                    M × {chamber.multiplier}
                  </Badge>
                }
                footer={
                  <div className="flex w-full justify-center">
                    <Button
                      asChild
                      size="md"
                      variant="primary"
                      className="w-56"
                    >
                      <Link to={`/app/chambers/${chamber.id}`}>Enter</Link>
                    </Button>
                  </div>
                }
              >
                <StatGrid items={makeChamberStats(chamber.stats)} />
                <PipelineList pipeline={chamber.pipeline} />
              </AppCard>
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyGovernance;
