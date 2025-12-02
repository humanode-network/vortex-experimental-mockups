import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const terms = [
  { term: "Governing era", definition: "A ~1 month period in which governors must meet activity thresholds to remain active." },
  { term: "Proposal pool", definition: "Attention stage where proposals need quorum/upvotes before chamber voting." },
  { term: "Chamber vote", definition: "Formal vote within a chamber with quorum and passing thresholds." },
  { term: "Formation", definition: "Grant-based system for projects with milestones and team slots." },
  { term: "CM panel", definition: "Controls and tracks Cognitocratic Measure multipliers across chambers." },
  { term: "Courts", definition: "Jury-based dispute system triggered by sufficient reports." },
  { term: "Faction", definition: "Interest group with members, ACM, and initiatives." },
];

const Vortexopedia: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Vortexopedia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {terms.map((item) => (
            <div key={item.term} className="rounded-xl border border-border bg-panel-alt px-3 py-2">
              <p className="text-sm font-semibold text-(--text)">{item.term}</p>
              <p className="text-xs text-muted">{item.definition}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vortexopedia;
