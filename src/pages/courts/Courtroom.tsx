import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { CourtStatusBadge } from "@/components/CourtStatusBadge";
import { VoteButton } from "@/components/VoteButton";
import { Button } from "@/components/primitives/button";
import { useAuth } from "@/app/auth/AuthContext";
import {
  apiCourt,
  apiCourtReport,
  apiCourtVerdict,
  apiHumans,
} from "@/lib/apiClient";
import type { CourtCaseDetailDto, HumanNodeDto } from "@/types/api";

const Courtroom: React.FC = () => {
  const { id } = useParams();
  const [courtCase, setCourtCase] = useState<CourtCaseDetailDto | null>(null);
  const [humansById, setHumansById] = useState<Record<string, HumanNodeDto>>(
    {},
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [court, humans] = await Promise.all([apiCourt(id), apiHumans()]);
        if (!active) return;
        setCourtCase(court);
        setHumansById(
          Object.fromEntries(humans.items.map((h) => [h.id, h] as const)),
        );
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setCourtCase(null);
        setHumansById({});
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const caseTitle =
    courtCase?.subject ?? (id ? `Courtroom · ${id}` : "Courtroom");

  const [verdict, setVerdict] = useState<"guilty" | "not_guilty" | null>(null);
  const votingEnabled = courtCase?.status === "live";
  const canAct = auth.authenticated && auth.eligible;

  const refresh = async () => {
    if (!id) return;
    const [court, humans] = await Promise.all([apiCourt(id), apiHumans()]);
    setCourtCase(court);
    setHumansById(
      Object.fromEntries(humans.items.map((h) => [h.id, h] as const)),
    );
  };

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    setActionBusy(true);
    try {
      await fn();
      await refresh();
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const juryMembers = (courtCase?.juryIds ?? []).map((memberId) => {
    const node = humansById[memberId];
    return {
      id: memberId,
      name: node?.name ?? memberId,
      role: node?.role,
      tier: node?.tier,
    };
  });

  const parties = useMemo(() => {
    return (courtCase?.parties ?? []).map((party) => {
      const node = humansById[party.humanId];
      return {
        ...party,
        name: node?.name ?? party.humanId,
        tier: node?.tier,
      };
    });
  }, [courtCase?.parties, humansById]);

  const renderInlineCode = (text: string) =>
    text.split(/`([^`]+)`/g).map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code
            key={`${idx}-${part}`}
            className="rounded bg-panel px-1 font-mono text-[0.92em] text-text"
          >
            {part}
          </code>
        );
      }
      return <span key={`${idx}-${part}`}>{part}</span>;
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courtroom" />

      {id && courtCase === null && !loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading courtroom…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Courtroom unavailable: {loadError}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="mt-1">{caseTitle}</CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2">
              {courtCase?.status ? (
                <CourtStatusBadge status={courtCase.status} />
              ) : null}
              <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
                <span>Opened {courtCase?.opened ?? "—"}</span>
                <span className="text-muted">·</span>
                <span>{courtCase?.reports ?? "—"} reports</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!id || !canAct || actionBusy}
                onClick={() =>
                  void runAction(async () => {
                    if (!id) return;
                    await apiCourtReport({ caseId: id });
                  })
                }
              >
                Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Verdict</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <VoteButton
              size="lg"
              tone="accent"
              label="Not guilty"
              disabled={!votingEnabled || !canAct || actionBusy}
              aria-pressed={verdict === "not_guilty"}
              className={
                verdict === "not_guilty"
                  ? "min-w-[260px] bg-accent text-accent-foreground"
                  : "min-w-[260px]"
              }
              onClick={() =>
                void runAction(async () => {
                  if (!id) return;
                  await apiCourtVerdict({ caseId: id, verdict: "not_guilty" });
                  setVerdict("not_guilty");
                })
              }
            />
            <VoteButton
              size="lg"
              tone="destructive"
              label="Guilty"
              disabled={!votingEnabled || !canAct || actionBusy}
              aria-pressed={verdict === "guilty"}
              className={
                verdict === "guilty"
                  ? "min-w-[260px] bg-destructive text-destructive-foreground"
                  : "min-w-[260px]"
              }
              onClick={() =>
                void runAction(async () => {
                  if (!id) return;
                  await apiCourtVerdict({ caseId: id, verdict: "guilty" });
                  setVerdict("guilty");
                })
              }
            />
          </div>
          {actionError ? (
            <p className="text-xs text-muted" role="status">
              {actionError}
            </p>
          ) : null}
          {!votingEnabled ? (
            <p className="text-xs text-muted">
              Voting is available only when the session is live.
            </p>
          ) : !auth.authenticated ? (
            <p className="text-xs text-muted">Connect a wallet to act.</p>
          ) : auth.authenticated && !auth.eligible ? (
            <p className="text-xs text-muted">
              Wallet is connected, but not active (gated).
            </p>
          ) : verdict ? (
            <p className="text-xs text-muted">
              Selected: {verdict === "guilty" ? "Guilty" : "Not guilty"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Proceedings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Claim</Kicker>
              <p className="mt-1 leading-relaxed text-text">
                {courtCase?.proceedings?.claim
                  ? renderInlineCode(courtCase.proceedings.claim)
                  : "—"}
              </p>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Evidence</Kicker>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-text">
                {(courtCase?.proceedings?.evidence ?? []).length > 0 ? (
                  courtCase?.proceedings?.evidence.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {renderInlineCode(item)}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Next steps</Kicker>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-text">
                {(courtCase?.proceedings?.nextSteps ?? []).length > 0 ? (
                  courtCase?.proceedings?.nextSteps.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {renderInlineCode(item)}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ol>
            </Surface>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parties.length > 0 ? (
                parties.map((party) => {
                  return (
                    <Surface
                      key={`${party.role}-${party.humanId}`}
                      variant="panelAlt"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Kicker>{party.role}</Kicker>
                          <p className="mt-0.5 text-sm font-semibold text-text">
                            {party.name}
                          </p>
                          {party.note ? (
                            <p className="mt-1 text-xs text-muted">
                              {party.note}
                            </p>
                          ) : null}
                        </div>
                        {party.tier ? (
                          <span className="mt-0.5 text-xs text-muted capitalize">
                            {party.tier}
                          </span>
                        ) : null}
                      </div>
                    </Surface>
                  );
                })
              ) : (
                <p className="text-sm text-muted">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Jury</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {juryMembers.map((member) => (
                <Surface
                  key={member.id}
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2 text-sm text-text"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{member.name}</span>
                    {member.tier ? (
                      <span className="text-xs text-muted capitalize">
                        {member.tier}
                      </span>
                    ) : null}
                  </div>
                  {member.role ? (
                    <p className="mt-0.5 text-xs text-muted">{member.role}</p>
                  ) : null}
                </Surface>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Courtroom;
