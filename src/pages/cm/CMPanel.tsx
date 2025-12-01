import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CMPanel: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-(--text)">CM panel</h1>
        <p className="text-sm text-muted">Track and adjust CM multipliers across chambers.</p>
      </header>
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          CM panel dashboards and controls will be added here.
        </CardContent>
      </Card>
    </div>
  );
};

export default CMPanel;
