import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Input } from "@/components/primitives/input";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { PageHeader } from "@/components/PageHeader";
import { TierLabel } from "@/components/TierLabel";
import type { ChamberProposalStageDto } from "@/types/api";
import { apiChamber, apiChambers } from "@/lib/apiClient";
import { NoDataYetBar } from "@/components/NoDataYetBar";

const Chamber: React.FC = () => {
  const { id } = useParams();
  const [chamberTitle, setChamberTitle] = useState<string>(() =>
    id ? id.replace(/-/g, " ") : "Chamber",
  );

  const [data, setData] = useState<{
    proposals: {
      id: string;
      title: string;
      meta: string;
      summary: string;
      lead: string;
      nextStep: string;
      timing: string;
      stage: ChamberProposalStageDto;
    }[];
    governors: { id: string; name: string; tier: string; focus: string }[];
    threads: {
      id: string;
      title: string;
      author: string;
      replies: number;
      updated: string;
    }[];
    chatLog: { id: string; author: string; message: string }[];
    stageOptions: { value: ChamberProposalStageDto; label: string }[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [stageFilter, setStageFilter] =
    useState<ChamberProposalStageDto>("upcoming");
  const [governorSearch, setGovernorSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [chamberRes, listRes] = await Promise.all([
          apiChamber(id),
          apiChambers(),
        ]);
        if (!active) return;
        setData(chamberRes);
        const found = listRes.items.find((c) => c.id === id);
        setChamberTitle(found?.name ?? id.replace(/-/g, " "));
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setData(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const filteredProposals = useMemo(
    () =>
      (data?.proposals ?? []).filter(
        (proposal) => proposal.stage === stageFilter,
      ),
    [data, stageFilter],
  );

  const filteredGovernors = useMemo(() => {
    const term = governorSearch.toLowerCase();
    return (data?.governors ?? []).filter(
      (gov) =>
        gov.name.toLowerCase().includes(term) ||
        gov.tier.toLowerCase().includes(term) ||
        gov.focus.toLowerCase().includes(term),
    );
  }, [data, governorSearch]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="chamber" />
      <PageHeader
        eyebrow="Chamber detail"
        title={<span className="capitalize">{chamberTitle}</span>}
        description="Proposal status, governor roster, and forum activity for this chamber."
      />

      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Chamber unavailable: {loadError}
        </Surface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div>
              <Kicker>Chamber vote</Kicker>
              <CardTitle>Proposal status</CardTitle>
            </div>
            <div
              className="flex w-full flex-wrap justify-center gap-2"
              role="tablist"
              aria-label="Proposal stages"
            >
              {(data?.stageOptions ?? []).map((option) => {
                const isSelected = stageFilter === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    role="tab"
                    size="sm"
                    aria-selected={isSelected}
                    variant="ghost"
                    onClick={() => setStageFilter(option.value)}
                    className={
                      isSelected
                        ? "border-(--glass-border-strong) bg-(--btn-primary-active-bg) text-primary-foreground shadow-(--shadow-primary) filter-[saturate(1.35)]"
                        : "border-border bg-panel text-muted hover:text-primary"
                    }
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredProposals.length === 0 ? (
              <Surface
                variant="panelAlt"
                borderStyle="dashed"
                className="px-4 py-6 text-center text-sm text-muted"
              >
                No proposals in this stage.
              </Surface>
            ) : (
              filteredProposals.map((proposal) => (
                <Surface key={proposal.id} variant="panelAlt" className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Kicker>{proposal.meta}</Kicker>
                      <h3 className="text-lg font-semibold text-text">
                        {proposal.title}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                    >
                      Lead {proposal.lead}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-text">{proposal.summary}</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <Kicker className="text-text">Next step</Kicker>
                      <p className="text-sm font-semibold text-text">
                        {proposal.nextStep}
                      </p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <Kicker className="text-text">Timing</Kicker>
                      <p className="text-sm font-semibold text-text">
                        {proposal.timing}
                      </p>
                    </Surface>
                  </div>
                </Surface>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <Kicker>Governors</Kicker>
              <CardTitle>Chamber roster</CardTitle>
            </div>
            <span className="rounded-full border border-border bg-panel-alt px-3 py-1 text-sm font-semibold">
              {data?.governors.length ?? 0}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={governorSearch}
              onChange={(event) => setGovernorSearch(event.target.value)}
              placeholder="Search governors"
            />
            <ul className="max-h-[360px] space-y-2 overflow-auto pr-1 text-sm text-text">
              {filteredGovernors.map((gov) => (
                <Surface
                  as="li"
                  key={gov.id}
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">{gov.name}</p>
                    <p className="text-xs text-muted">
                      <TierLabel tier={gov.tier} /> · {gov.focus}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/human-nodes/${gov.id}`}>Profile</Link>
                  </Button>
                </Surface>
              ))}
              {filteredGovernors.length === 0 && (
                <Surface
                  as="li"
                  variant="panelAlt"
                  radius="xl"
                  borderStyle="dashed"
                  className="px-3 py-4 text-center text-muted"
                >
                  No governors found.
                </Surface>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-5"
      >
        <header className="mb-4 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Kicker>Chamber forum</Kicker>
            <h2 className="text-lg font-semibold text-text">Threads & chat</h2>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-3">
            {(data?.threads ?? []).length === 0 ? (
              <NoDataYetBar label="threads" />
            ) : (
              (data?.threads ?? []).map((thread) => (
                <article key={thread.id} className="contents">
                  <Surface variant="panelAlt" className="px-4 py-3">
                    <h3 className="text-base font-semibold text-text">
                      {thread.title}
                    </h3>
                    <p className="text-sm text-muted">
                      {thread.author} · {thread.replies} replies · Updated{" "}
                      {thread.updated}
                    </p>
                  </Surface>
                </article>
              ))
            )}
          </div>

          <Surface variant="panelAlt" className="p-4">
            <header className="text-sm font-semibold text-text">
              Chamber chat
            </header>
            <div className="my-3 max-h-64 space-y-2 overflow-auto pr-2 text-sm">
              {(data?.chatLog ?? []).length === 0 ? (
                <p className="text-muted">No chat messages yet.</p>
              ) : (
                (data?.chatLog ?? []).map((entry) => (
                  <p key={entry.id}>
                    <strong>{entry.author}:</strong> {entry.message}
                  </p>
                ))
              )}
            </div>
          </Surface>
        </div>
      </Surface>
    </div>
  );
};

export default Chamber;
