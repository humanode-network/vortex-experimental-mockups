import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { apiHuman, apiHumans } from "@/lib/apiClient";
import type { HumanNodeProfileDto, ProofKeyDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";

const Profile: React.FC = () => {
  const auth = useAuth();
  const [activeProof, setActiveProof] = useState<ProofKeyDto | "">("");
  const [profile, setProfile] = useState<HumanNodeProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.enabled || !auth.authenticated || !auth.address) {
      setProfile(null);
      setLoadError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const humans = await apiHumans();
        const list = humans.items;
        if (!list.length) {
          if (!active) return;
          setProfile(null);
          setLoadError("No human nodes are available.");
          return;
        }

        const address = auth.address;
        if (!address) {
          if (!active) return;
          setProfile(null);
          setLoadError("Wallet address is missing.");
          return;
        }
        const hash = Array.from(address).reduce(
          (acc, ch) => acc + ch.charCodeAt(0),
          0,
        );
        const selected = list[hash % list.length];
        const res = await apiHuman(selected.id);
        if (!active) return;
        setProfile(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProfile(null);
        setLoadError((error as Error).message);
      }
    })();

    return () => {
      active = false;
    };
  }, [auth.address, auth.authenticated, auth.enabled]);

  const proofOptions = useMemo(
    () => [
      {
        value: "time",
        label: <HintLabel termId="proof_of_time_pot">PoT</HintLabel>,
      },
      {
        value: "devotion",
        label: <HintLabel termId="proof_of_devotion_pod">PoD</HintLabel>,
      },
      {
        value: "governance",
        label: <HintLabel termId="proof_of_governance_pog">PoG</HintLabel>,
      },
    ],
    [],
  );

  const activeSection =
    profile && activeProof ? profile.proofSections[activeProof] : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="profile" />
      {!auth.enabled ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Auth is disabled in this build.
        </Card>
      ) : !auth.authenticated ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Connect a wallet to view the profile.
        </Card>
      ) : profile === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {loadError ? `Profile unavailable: ${loadError}` : "Loading profile…"}
        </Card>
      ) : null}

      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <AvatarPlaceholder
              initials={profile?.name?.substring(0, 2).toUpperCase() ?? "—"}
              size="lg"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <Kicker align="center">My profile</Kicker>
            <h1 className="text-3xl font-semibold text-text">
              {profile?.name ?? "—"}
            </h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <StatusPill
              label="Governor"
              value={profile?.governorActive ? "Active" : "Not active"}
              active={profile?.governorActive ?? false}
            />
            <StatusPill
              label="Human node"
              value={profile?.humanNodeActive ? "Active" : "Not active"}
              active={profile?.humanNodeActive ?? false}
            />
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(profile?.heroStats ?? []).map((stat) => (
          <Card key={stat.label} className="h-full">
            <CardContent className="space-y-1 p-4 text-center">
              <Kicker align="center">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm" termText="ACM" />
                ) : stat.label === "MM" ? (
                  <HintLabel termId="meritocratic_measure" termText="MM" />
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-2xl font-semibold text-text">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>{profile?.governanceSummary ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-scroll pr-2 sm:grid-cols-2 xl:grid-cols-3">
                {(profile?.governanceActions ?? []).map((action) => (
                  <div key={action.title} className="group relative">
                    <Surface
                      variant="panelAlt"
                      radius="xl"
                      shadow="tile"
                      className="space-y-1 px-3 py-3 text-center"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-text">
                        {action.title}
                      </p>
                      <Kicker
                        align="center"
                        className="line-clamp-1 text-primary"
                      >
                        {action.action}
                      </Kicker>
                      <p className="line-clamp-1 text-xs text-muted">
                        {action.context}
                      </p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="popover"
                      className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-64 -translate-x-1/2 p-3 text-left text-xs text-text opacity-0 transition group-hover:opacity-100"
                    >
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-muted">{action.context}</p>
                      <p className="mt-1 leading-snug">{action.detail}</p>
                    </Surface>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Formation projects</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-4 overflow-y-auto pr-1">
              {(profile?.projects ?? []).map((project) => (
                <Surface
                  key={project.title}
                  variant="panelAlt"
                  radius="xl"
                  className="px-4 py-3"
                >
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-sm font-semibold text-text">
                      {project.title}
                    </p>
                    <Kicker align="center">{project.status}</Kicker>
                  </div>
                  <p className="text-center text-sm text-muted">
                    {project.summary}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {project.chips.map((chip) => (
                      <Badge key={chip} variant="outline">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </Surface>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-center sm:grid-cols-2">
                {(profile?.quickDetails ?? []).map((detail) => (
                  <div
                    key={detail.label}
                    className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-3"
                  >
                    <Kicker align="center">{detail.label}</Kicker>
                    <p className="text-base font-semibold text-text">
                      {detail.label === "Tier" ? (
                        <TierLabel tier={detail.value} />
                      ) : (
                        detail.value
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-center">
                <ToggleGroup
                  value={activeProof}
                  onValueChange={(val) =>
                    setActiveProof(val as ProofKeyDto | "")
                  }
                  options={proofOptions}
                  allowDeselect
                />
                {activeSection ? (
                  <div className="grid gap-3 text-sm text-text sm:grid-cols-2">
                    {(activeSection.items ?? []).map(
                      (item: { label: string; value: string }) => (
                        <div
                          key={item.label}
                          className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-2 text-center"
                        >
                          <Kicker
                            align="center"
                            className="min-h-6 leading-tight"
                          >
                            {item.label}
                          </Kicker>
                          <p className="min-h-5 text-sm font-semibold text-text">
                            {item.value}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(profile?.history ?? []).map((entry) => (
                <div
                  key={entry}
                  className="rounded-xl border border-border px-3 py-2 text-center text-sm text-text"
                >
                  {entry}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
