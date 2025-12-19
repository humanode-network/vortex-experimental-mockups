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
import { getHumanNodeProfile } from "@/data/mock/humanNodeProfiles";

const FullHistory: React.FC = () => {
  const { id } = useParams();
  const profile = getHumanNodeProfile(id);
  const name = profile.name;
  const activity = profile.activity;

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
            <ButtonLink to={`/app/human-nodes/${id ?? ""}`}>
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
