import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProposalPP: React.FC = () => {
  const { id } = useParams();
  const proposalId = id ?? "proposal";

  const proposal = {
    title: "Sequencer redundancy rollout",
    proposer: "John Doe",
    proposerId: "john-doe",
    chamber: "Protocol chamber",
    focus: "Liveness & validators",
    tier: "Legate",
    budget: "210k HMND",
    impact: "High",
    stageAge: "2d 6h",
    cooldown: "Withdraw cooldown: 12h",
    upvotes: 18,
    downvotes: 4,
    attentionQuorum: 0.22,
    activeGovernors: 100,
    upvoteFloor: 10,
  };

  const engaged = proposal.upvotes + proposal.downvotes;
  const attentionNeeded = Math.ceil(proposal.activeGovernors * proposal.attentionQuorum);
  const attentionPercent = Math.round((engaged / proposal.activeGovernors) * 100);
  const attentionNeededPercent = Math.round(proposal.attentionQuorum * 100);
  const meetsUpvoteFloor = proposal.upvotes >= proposal.upvoteFloor;
  const meetsAttention = engaged >= attentionNeeded;
  const readyForChamber = meetsUpvoteFloor && meetsAttention;
  const upvoteFloorPercent = Math.round((proposal.upvoteFloor / proposal.activeGovernors) * 100);
  const upvoteCurrentPercent = Math.round((proposal.upvotes / proposal.activeGovernors) * 100);

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-panel p-6">
        <div className="grid items-start gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-(--text)">{proposal.title}</h1>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel-alt px-4 py-4 text-center">
                <p className="text-[0.8rem] uppercase tracking-wide text-muted">Chamber</p>
                <p className="text-xl font-semibold">{proposal.chamber}</p>
              </div>
              <div className="rounded-2xl border border-border bg-panel-alt px-4 py-4 text-center">
                <p className="text-[0.8rem] uppercase tracking-wide text-muted">Proposer</p>
                <p className="text-xl font-semibold">{proposal.proposer}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="rounded-full border-2 border-emerald-500 px-6 py-3 text-base font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
              >
                Upvote
              </button>
              <button
                type="button"
                className="rounded-full border-2 border-red-500 px-6 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white"
              >
                Downvote
              </button>
            </div>
            <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-panel-alt px-6 py-3 text-base font-semibold text-(--text)">
              <span className="text-emerald-600">{proposal.upvotes} upvotes</span>
              <span className="text-muted">·</span>
              <span className="text-red-600">{proposal.downvotes} downvotes</span>
            </div>
          </div>

          <Card className="h-full border border-border bg-panel-alt">
            <CardHeader className="pb-2">
              <CardTitle>Quorum of attention</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-2">
              <div className="flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] uppercase tracking-wide text-muted">Governors</p>
                <p className="text-2xl font-semibold whitespace-nowrap">{engaged} / {attentionNeeded}</p>
              </div>
              <div className="flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] uppercase tracking-wide text-muted">Upvotes</p>
                <p className="text-2xl font-semibold whitespace-nowrap">{proposal.upvotes} / {proposal.upvoteFloor}</p>
              </div>
              <div className="flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] uppercase tracking-wide text-muted whitespace-nowrap">Governors (%)</p>
                <p className="text-2xl font-semibold whitespace-nowrap">{attentionPercent} / {attentionNeededPercent}</p>
              </div>
              <div className="flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] uppercase tracking-wide text-muted whitespace-nowrap">Upvotes (%)</p>
                <p className="text-2xl font-semibold whitespace-nowrap">{upvoteCurrentPercent} / {upvoteFloorPercent}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>
              Introduce redundant biometric sequencers to reduce failover time and enable double commits across epochs. Pool stage is collecting quorum of attention before moving to a chamber vote.
            </p>
            <div className="grid gap-2 text-sm text-(--text) sm:grid-cols-3">
              {[
                { label: "Budget ask", value: proposal.budget },
                { label: "Impact", value: proposal.impact },
                { label: "Stage age", value: proposal.stageAge },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-panel-alt px-3 py-2 text-center">
                  <p className="text-[0.7rem] uppercase tracking-wide text-muted">{item.label}</p>
                  <p className="text-base font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Pool rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <ul className="list-disc space-y-1 pl-4">
              <li>22% attention from active governors required (no delegations).</li>
              <li>At least 10% upvotes to move to chamber.</li>
              <li>Delegated votes are ignored in the pool.</li>
              <li>{proposal.cooldown}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Invision insight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-(--text)">
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>Addresses liveness bottlenecks by adding redundant biometric sequencers and cross-epoch checkpoints.</li>
            <li>Focuses on validator neutrality: rollout reduces single-operator dependence in failover events.</li>
            <li>Formation impact: new telemetry and health-kit playbooks needed alongside hardware budget.</li>
            <li>Risk note: requires chamber coordination for staged deployment and rollback on adverse metrics.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalPP;
