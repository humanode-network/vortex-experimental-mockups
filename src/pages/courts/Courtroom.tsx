import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { AppPage } from "@/components/AppPage";

const jury = [
  "John Doe",
  "Raamara",
  "Nyx",
  "Nana",
  "Victor",
  "Tony",
  "Dima",
  "Shannon",
  "Artem",
  "Lena",
  "Cass",
  "Victor M",
];

const Courtroom: React.FC = () => {
  const { id } = useParams();
  const caseTitle = id ? `Courtroom · ${id}` : "Courtroom";

  return (
    <AppPage pageId="courtroom">
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
              <p className="text-xs tracking-wide text-muted uppercase">
                Subject
              </p>
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
              <p className="text-xs tracking-wide text-muted uppercase">
                Trigger
              </p>
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
            <p className="text-xs tracking-wide text-muted uppercase">Claim</p>
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
            <p className="text-xs tracking-wide text-muted uppercase">
              Evidence
            </p>
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
            <p className="text-xs tracking-wide text-muted uppercase">
              Next steps
            </p>
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
    </AppPage>
  );
};

export default Courtroom;
