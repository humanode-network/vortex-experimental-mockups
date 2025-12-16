import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AppPage } from "@/components/AppPage";

const eraActivity = {
  era: "142",
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

const MyGovernance: React.FC = () => {
  return (
    <AppPage pageId="my-governance">
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
              { label: "Era", value: eraActivity.era },
              { label: "Time left", value: eraActivity.timeLeft },
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
                value: `${eraActivity.completed} / ${eraActivity.required} completed`,
              },
              {
                key: "status",
                label: "Status",
                value:
                  eraActivity.completed >= eraActivity.required
                    ? "On track"
                    : "At risk",
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
            {eraActivity.actions.map((act) => (
              <Surface
                key={act.label}
                variant="panelAlt"
                radius="xl"
                shadow="tile"
                className="flex h-full flex-col items-center justify-center px-3 py-3 text-center"
              >
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  {act.label}
                </p>
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
        <CardContent>
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4 text-center"
            >
              <p className="text-xs tracking-wide text-muted uppercase">
                Current tier
              </p>
              <p className="text-lg font-semibold text-text">
                <HintLabel termId="tier3_legate">Legate</HintLabel>
              </p>
            </Surface>
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
              <p className="text-sm font-semibold text-text">68% to Consul</p>
            </div>
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4 text-center"
            >
              <p className="text-xs tracking-wide text-muted uppercase">
                Next tier
              </p>
              <p className="text-lg font-semibold text-text">
                <HintLabel termId="tier4_consul">Consul</HintLabel>
              </p>
            </Surface>
          </div>
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="mt-4 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text">
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
            <p className="mt-2 text-xs font-semibold text-text">78%</p>
          </Surface>
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text">
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
            <p className="mt-2 text-xs font-semibold text-text">50%</p>
          </Surface>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Have your proposal accepted in Vortex",
              "Participate in a project through Formation",
            ].map((label) => (
              <Surface
                key={label}
                variant="panelAlt"
                radius="2xl"
                shadow="tile"
                className="flex items-center justify-between p-4"
              >
                <p className="text-sm font-semibold text-text">{label}</p>
                <span className="bg-ok/20 text-ok inline-flex h-6 w-6 items-center justify-center rounded-full">
                  ✓
                </span>
              </Surface>
            ))}
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
                <HintLabel termId="tier3_legate">Legate</HintLabel>
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
            </Surface>
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-text">
                Proposals available with{" "}
                <HintLabel termId="tier4_consul">Consul</HintLabel>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>Administrative</li>
              </ul>
            </Surface>
          </div>
        </CardContent>
      </Card>
    </AppPage>
  );
};

export default MyGovernance;
