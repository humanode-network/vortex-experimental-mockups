import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { proposalDraftDetails as draftDetails } from "@/data/mock/proposalDraft";
import { TierLabel } from "@/components/TierLabel";
import { AttachmentList } from "@/components/AttachmentList";
import { TitledSurface } from "@/components/TitledSurface";

const ProposalDraft: React.FC = () => {
  const [filledSlots, totalSlots] = draftDetails.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
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
              value={<TierLabel tier={draftDetails.tier} />}
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
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Proposal overview"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm leading-relaxed text-muted">
                Redundant sequencers across clusters with cross-epoch
                checkpointing to keep biometric validation live during
                failovers. Includes telemetry surfacing, alerting hooks, and
                rollback gates tied to liveness SLOs. Targets neutral failover
                without privileging any validator set.
              </p>
            </TitledSurface>
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Execution plan"
              className="space-y-2 px-3 py-3"
            >
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
            </TitledSurface>
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Budget &amp; scope"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm text-muted">
                210k HMND covering hardware, telemetry integration, and rollout
                validation. Team: {draftDetails.teamSlots} with milestone target
                of {draftDetails.milestones.length}; includes QA, ops, and
                telemetry owners.
              </p>
            </TitledSurface>
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

          <AttachmentList
            items={draftDetails.attachments.map((file) => ({
              id: file.title,
              title: file.title,
            }))}
          />
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
    </div>
  );
};

export default ProposalDraft;
