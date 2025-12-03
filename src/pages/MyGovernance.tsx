import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const eraActivity = {
  era: "Era 142",
  required: 18,
  completed: 11,
  actions: [
    { label: "Pool votes", done: 5, required: 6 },
    { label: "Chamber votes", done: 3, required: 6 },
    { label: "Court actions", done: 1, required: 3 },
    { label: "Proposals", done: 2, required: 3 },
  ],
  timeLeft: "22d 14h",
};

const progression = {
  currentTier: {
    title: "Tier 3 · Legate",
    rights: "Can propose core infrastructure changes",
    description: "Active for 1 year; proposal accepted; Formation participant.",
  },
  nextTier: {
    title: "Tier 4 · Consul",
    remaining: [
      "Run node 2 years",
      "Active governor 2 years",
      "Proposal accepted",
      "Formation participation",
    ],
  },
  readiness: 68,
  proof: {
    pot: {
      primary: "1 Y · 6 M human node",
      secondary: "1 Y · 3 M governor",
      progress: 75,
    },
    pod: {
      primary: "2 proposals accepted",
      secondary: "Formation member",
      progress: 55,
    },
    pog: {
      primary: "Active streak: 3 eras",
      secondary: "Actions this era: 11 / 18",
      progress: 61,
    },
  },
};

const MyGovernance: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <Card className="bg-panel border border-border">
        <CardHeader className="pb-2">
          <CardTitle>Governing threshold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Era", value: eraActivity.era },
              { label: "Time left", value: eraActivity.timeLeft },
            ].map((tile) => (
              <div
                key={tile.label}
                className="bg-panel-alt flex h-full flex-col items-center justify-center rounded-2xl border border-border px-4 py-4 text-center"
              >
                <p className="text-sm text-muted">{tile.label}</p>
                <p className="text-xl font-semibold text-(--text)">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Required actions",
                value: `${eraActivity.completed} / ${eraActivity.required} completed`,
              },
              {
                label: "Status",
                value:
                  eraActivity.completed >= eraActivity.required
                    ? "On track"
                    : "At risk",
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className="bg-panel-alt flex h-full flex-col items-center justify-center rounded-2xl border border-border px-4 py-4 text-center"
              >
                <p className="text-sm text-muted">{tile.label}</p>
                <p className="text-xl font-semibold text-(--text)">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {eraActivity.actions.map((act) => (
              <div
                key={act.label}
                className="bg-panel-alt flex h-full flex-col items-center justify-center rounded-xl border border-border px-3 py-3 text-center"
              >
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  {act.label}
                </p>
                <p className="text-base font-semibold text-(--text)">
                  {act.done} / {act.required}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel border border-border">
        <CardHeader className="pb-2">
          <CardTitle>Progression dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="bg-panel-alt rounded-2xl border border-border p-4 text-center">
              <p className="text-xs tracking-wide text-muted uppercase">
                Current tier
              </p>
              <p className="text-lg font-semibold text-(--text)">Legate</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 px-2">
              <p className="text-xs tracking-wide text-muted uppercase">
                Progress
              </p>
              <div className="relative h-2 w-48 overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: "68%" }}
                />
              </div>
              <p className="text-sm font-semibold text-(--text)">
                68% to Consul
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border p-4 text-center">
              <p className="text-xs tracking-wide text-muted uppercase">
                Next tier
              </p>
              <p className="text-lg font-semibold text-(--text)">Consul</p>
            </div>
          </div>
          <div className="bg-panel-alt mt-4 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--text)">
                Run a node for 2 years
              </p>
              <p className="text-sm text-muted">1 Y 204 D</p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "78%" }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-(--text)">78%</p>
          </div>
          <div className="bg-panel-alt rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--text)">
                Be an active governor for 2 years
              </p>
              <p className="text-sm text-muted">1 Y 2 D</p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "50%" }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-(--text)">50%</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Have your proposal accepted in Vortex",
              "Participate in a project through Formation",
            ].map((label) => (
              <div
                key={label}
                className="bg-panel-alt flex items-center justify-between rounded-2xl border border-border p-4"
              >
                <p className="text-sm font-semibold text-(--text)">{label}</p>
                <span className="bg-ok/20 text-ok inline-flex h-6 w-6 items-center justify-center rounded-full">
                  ✓
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bg-panel-alt rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-(--text)">
                Proposals available with Legate
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>
                  Basic (all except fee, monetary, core infra, administrative,
                  DAO core)
                </li>
                <li>Fee distribution</li>
                <li>Monetary system</li>
                <li>Core infrastructure</li>
              </ul>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-(--text)">
                Proposals available with Consul
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>Administrative</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyGovernance;
