import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiChambers, apiMyGovernance } from "@/lib/apiClient";
import type { ChamberDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";

const CMPanel: React.FC = () => {
  const auth = useAuth();
  const [chambers, setChambers] = useState<ChamberDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myChamberIds, setMyChamberIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiChambers();
        if (!active) return;
        setChambers(res.items);
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

  useEffect(() => {
    if (!auth.enabled || !auth.authenticated) {
      setMyChamberIds([]);
      return;
    }
    let active = true;
    void apiMyGovernance()
      .then((res) => {
        if (!active) return;
        setMyChamberIds(res.myChamberIds ?? []);
      })
      .catch(() => {
        if (!active) return;
        setMyChamberIds([]);
      });
    return () => {
      active = false;
    };
  }, [auth.authenticated, auth.enabled]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="cm-panel" />
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-[var(--destructive)]">
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
          <p>
            This panel shows chamber multipliers used for{" "}
            <HintLabel termId="cognitocratic_measure">CM</HintLabel>.
          </p>
          <p className="mt-2">
            In v1 simulation this is{" "}
            <span className="font-semibold">view-only</span>. Membership-based
            visibility is derived from “My chambers” when a wallet is connected.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(chambers ?? []).map((chamber) => {
            const isMember = myChamberIds.includes(chamber.id);
            return (
              <Surface
                key={chamber.id}
                variant="panelAlt"
                className={`relative px-4 py-3 ${isMember ? "opacity-50" : ""}`}
              >
                {isMember ? (
                  <div className="absolute inset-0 rounded-2xl bg-panel-alt/60 backdrop-blur-sm" />
                ) : null}
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text">
                      {chamber.name}
                    </p>
                    <Badge variant="outline">M × {chamber.multiplier}</Badge>
                  </div>
                  {isMember ? (
                    <p className="text-xs text-muted">
                      Member chamber (visibility only).
                    </p>
                  ) : null}
                </div>
              </Surface>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default CMPanel;
