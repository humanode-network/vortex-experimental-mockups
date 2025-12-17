import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { courtroomJury as jury } from "@/data/mock/courtroom";

const Courtroom: React.FC = () => {
  const { id } = useParams();
  const caseTitle = id ? `Courtroom · ${id}` : "Courtroom";

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courtroom" />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{caseTitle}</CardTitle>
          <p className="text-sm text-muted">
            Delegation Dispute · Jury of 12 governors
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Status: Jury</Badge>
            <Badge variant="outline">Opened: 02/04/2025</Badge>
            <Badge variant="outline">Reports: 18</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="p-3"
            >
              <Kicker>Subject</Kicker>
              <p className="text-sm font-semibold text-text">
                Delegation dispute on Protocol Keepers
              </p>
            </Surface>
            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="p-3"
            >
              <Kicker>Trigger</Kicker>
              <p className="text-sm font-semibold text-text">
                18 reports · Delegation shift
              </p>
            </Surface>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Jury</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {jury.map((member) => (
            <Surface
              key={member}
              variant="panelAlt"
              radius="xl"
              shadow="control"
              className="px-3 py-2 text-sm text-text"
            >
              {member}
            </Surface>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Proceedings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <Surface
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="px-3 py-2"
          >
            <Kicker>Claim</Kicker>
            <p>
              Delegation was rerouted without consent; requester asks for
              reversal and audit.
            </p>
          </Surface>
          <Surface
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="px-3 py-2"
          >
            <Kicker>Evidence</Kicker>
            <ul className="list-disc pl-4">
              <li>Delegation log entries · epoch 220-221</li>
              <li>Screenshots from faction portal</li>
            </ul>
          </Surface>
          <Surface
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="px-3 py-2"
          >
            <Kicker>Next steps</Kicker>
            <ul className="list-disc pl-4">
              <li>Collect jury statements</li>
              <li>Schedule deliberation</li>
            </ul>
          </Surface>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm">
          Download case file
        </Button>
        <Button size="sm">Add note</Button>
      </div>
    </div>
  );
};

export default Courtroom;
