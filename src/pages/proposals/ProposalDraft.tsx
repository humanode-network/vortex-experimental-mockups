import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProposalStageBar from "@/components/ProposalStageBar";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { AppPage } from "@/components/AppPage";

const draftDetails = {
  title: "Mesh Telemetry Upgrade",
  proposer: "John Doe",
  chamber: "Protocol Engineering",
  focus: "Liveness & validators",
  tier: "Legate",
  budget: "210k HMND",
  formationEligible: true,
  teamSlots: "3 / 6",
  milestonesPlanned: "2 planned · pilot + rollout",
  summary:
    "Refine telemetry ingestion and alerting for sequencer failover playbooks with progressive rollout.",
  rationale:
    "Improve liveness detection by aggregating probes, tuning alerts, and aligning dashboards with chamber SLOs before chamber submission.",
  checklist: [
    "Define KPIs and failure domains.",
    "Add staged alerting and on-call runbooks.",
    "Align Formation playbooks for rollout.",
  ],
  milestones: [
    "Pilot deploy on two clusters; collect baselines.",
    "Global rollout with rollback gates.",
    "Docs, dashboards, and operator training.",
  ],
  teamLocked: [
    { name: "John Doe", role: "Lead · Protocol" },
    { name: "Raamara", role: "Ops & rollout" },
    { name: "Nyx", role: "Telemetry" },
  ],
  openSlotNeeds: [
    {
      title: "SRE / Reliability",
      desc: "Own failover playbooks and alert tuning during rollout.",
    },
    {
      title: "QA engineer",
      desc: "Validate checkpoints and regression-test liveness across clusters.",
    },
    {
      title: "Tech writer",
      desc: "Document runbooks and operator guides post-rollout.",
    },
  ],
  milestonesDetail: [
    {
      title: "Pilot deploy",
      desc: "Shadow checkpoints on 2 clusters; collect liveness/latency baselines.",
    },
    {
      title: "Global rollout",
      desc: "Stage to remaining clusters with rollback gates on regressions.",
    },
    {
      title: "Handoff & docs",
      desc: "Finalize dashboards, runbooks, and training for chamber ops.",
    },
  ],
  attachments: [
    { title: "Rollout plan (PDF)", href: "#" },
    { title: "Telemetry checklist (DOC)", href: "#" },
    { title: "Budget breakdown (XLS)", href: "#" },
  ],
};

const ProposalDraft: React.FC = () => {
  const [filledSlots, totalSlots] = draftDetails.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);

  return (
    <AppPage pageId="proposals">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/proposals/drafts">Back to drafts</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/proposals/new">Edit proposal</Link>
          </Button>
          <Button size="sm">Submit to pool</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="text-2xl font-semibold text-text">
            {draftDetails.title}
          </CardTitle>
          <ProposalStageBar current="draft" />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Chamber"
              value={draftDetails.chamber}
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
            <StatTile
              label="Proposer"
              value={draftDetails.proposer}
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
            <StatTile
              label="Tier"
              value={
                <HintLabel termId="tier3_legate">{draftDetails.tier}</HintLabel>
              }
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Budget ask", value: draftDetails.budget },
              {
                label: "Formation",
                value: draftDetails.formationEligible ? "Yes" : "No",
              },
              {
                label: "Team slots",
                value: `${draftDetails.teamSlots} (open: ${openSlots})`,
              },
              {
                label: "Milestones",
                value: draftDetails.milestonesPlanned,
              },
            ].map((item) => (
              <StatTile
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>

          <Surface variant="panelAlt" className="space-y-4 px-4 py-4 text-text">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Summary</p>
              <p className="text-sm leading-relaxed text-muted">
                {draftDetails.summary}
              </p>
            </div>
            <Surface
              variant="panel"
              radius="xl"
              shadow="control"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Redundant sequencers across clusters with cross-epoch
                checkpointing to keep biometric validation live during
                failovers. Includes telemetry surfacing, alerting hooks, and
                rollback gates tied to liveness SLOs. Targets neutral failover
                without privileging any validator set.
              </p>
            </Surface>
            <Surface
              variant="panel"
              radius="xl"
              shadow="control"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm font-semibold">Execution plan</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>
                  Pilot (2 weeks): 2 clusters, shadow checkpoints, watch
                  liveness/latency.
                </li>
                <li>
                  Rollout (next 4 weeks): stage to remaining clusters with
                  checkpoint cadence.
                </li>
                <li>
                  Observability: dashboards, alerts on failover duration, revert
                  on &gt;1% liveness regression for 2 epochs.
                </li>
                <li>
                  Post-rollout: document runbooks and handoff to chamber ops.
                </li>
              </ul>
            </Surface>
            <Surface
              variant="panel"
              radius="xl"
              shadow="control"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm font-semibold">Budget &amp; scope</p>
              <p className="text-sm text-muted">
                210k HMND covering hardware, telemetry integration, and rollout
                validation. Team: {draftDetails.teamSlots} with milestone target
                of {draftDetails.milestones.length}; includes QA, ops, and
                telemetry owners.
              </p>
            </Surface>
          </Surface>

          <div className="grid gap-3 lg:grid-cols-2">
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Team (locked)</p>
              <ul className="space-y-2 text-sm text-muted">
                {draftDetails.teamLocked.map((member) => (
                  <Surface
                    key={member.name}
                    as="li"
                    variant="panel"
                    radius="xl"
                    shadow="control"
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="font-semibold text-text">
                      {member.name}
                    </span>
                    <span className="text-xs text-muted">{member.role}</span>
                  </Surface>
                ))}
              </ul>
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Open slots (positions)</p>
              <ul className="space-y-2 text-sm text-muted">
                {draftDetails.openSlotNeeds.map((slot) => (
                  <Surface
                    key={slot.title}
                    as="li"
                    variant="panel"
                    radius="xl"
                    shadow="control"
                    className="px-3 py-2"
                  >
                    <p className="font-semibold text-text">{slot.title}</p>
                    <p className="text-xs text-muted">{slot.desc}</p>
                  </Surface>
                ))}
              </ul>
            </Surface>
          </div>

          <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">Milestones</p>
            <ul className="space-y-2 text-sm text-muted">
              {draftDetails.milestonesDetail.map((ms) => (
                <Surface
                  key={ms.title}
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <p className="font-semibold text-text">{ms.title}</p>
                  <p className="text-xs text-muted">{ms.desc}</p>
                </Surface>
              ))}
            </ul>
          </Surface>

          <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">Attachments</p>
            <ul className="space-y-2 text-sm text-muted">
              {draftDetails.attachments.map((file) => (
                <Surface
                  key={file.title}
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span>{file.title}</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </Surface>
              ))}
            </ul>
          </Surface>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Invision insight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text">
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>
              Addresses liveness bottlenecks by adding redundant biometric
              sequencers and cross-epoch checkpoints.
            </li>
            <li>
              Focuses on validator neutrality: rollout reduces single-operator
              dependence in failover events.
            </li>
            <li>Risk note: requires staged deployment with rollback gates.</li>
          </ul>
        </CardContent>
      </Card>
    </AppPage>
  );
};

export default ProposalDraft;
