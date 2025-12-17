import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { PageHint } from "@/components/PageHint";
import { PageHeader } from "@/components/PageHeader";
import { Kicker } from "@/components/Kicker";
import { Link, useParams } from "react-router";

type HistoryItem = {
  title: string;
  action: string;
  context: string;
  detail: string;
  date: string;
};

const activity: HistoryItem[] = [
  {
    title: "Fee telemetry upgrade #225",
    action: "Authored proposal",
    context: "Protocol chamber",
    detail:
      "Outlined dual-path telemetry for biometric proofs and mesh fee reporting.",
    date: "Epoch 192",
  },
  {
    title: "Treasury split adjustment #883",
    action: "Presented motion",
    context: "Economic chamber",
    detail: "Balanced Formation vs. treasury disbursements.",
    date: "Epoch 188",
  },
  {
    title: "Protocol SSC quorum drill",
    action: "Coordinated drill",
    context: "Protocol chamber",
    detail: "Simulated quorum loss and documented timings.",
    date: "Epoch 186",
  },
  {
    title: "Mesh sequencer redundancy",
    action: "Reviewed implementation",
    context: "Formation",
    detail:
      "Signed off on milestone 3 safety checklist for redundant sequencers.",
    date: "Epoch 183",
  },
  {
    title: "Budget oversight motion",
    action: "Co-authored memo",
    context: "Governance proposal pool",
    detail: "Drafted memo summarizing risk thresholds for fiscal year.",
    date: "Epoch 181",
  },
  {
    title: "Chamber audit sync",
    action: "Hosted session",
    context: "Security chamber",
    detail: "Reviewed incidents and matched to audit trails.",
    date: "Epoch 179",
  },
  {
    title: "Formation handover 12",
    action: "Signed off",
    context: "Formation",
    detail: "Validated milestone artifacts and updated ops board.",
    date: "Epoch 177",
  },
  {
    title: "Governor onboarding brief",
    action: "Led workshop",
    context: "Protocol chamber",
    detail: "Quickstart checklist for new governors joining mesh topics.",
    date: "Epoch 175",
  },
  {
    title: "Network health retro",
    action: "Published report",
    context: "Protocol council",
    detail: "Shared dashboard snapshots and postmortem experiments.",
    date: "Epoch 173",
  },
  {
    title: "Deterrence sim drill",
    action: "Activated standby",
    context: "Security & infra",
    detail: "Ran pager playbook and escalated to infra for acknowledgement.",
    date: "Epoch 171",
  },
];

const FullHistory: React.FC = () => {
  const { id } = useParams();
  const name = id ?? "Human node";

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="human-node" />
      <PageHeader
        eyebrow="Full history"
        title={name}
        titleClassName="text-2xl text-foreground"
      />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>All actions</CardTitle>
            <ButtonLink to={`/human-nodes/${id ?? ""}`}>
              Back to profile
            </ButtonLink>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((item) => (
            <div
              key={`${item.title}-${item.date}`}
              className="rounded-2xl border border-border px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <Kicker className="text-primary">{item.action}</Kicker>
                </div>
                <p className="text-xs text-muted">{item.date}</p>
              </div>
              <p className="text-xs text-muted">{item.context}</p>
              <p className="mt-1 text-sm text-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const ButtonLink: React.FC<{ to: string; children: React.ReactNode }> = ({
  to,
  children,
}) => (
  <Link
    to={to}
    className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground hover:border-primary"
  >
    {children}
  </Link>
);

export default FullHistory;
