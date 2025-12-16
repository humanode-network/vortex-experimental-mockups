import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const General: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-text">General</h1>
        <p className="text-sm text-muted">
          Global preferences and account options.
        </p>
      </header>
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Configure your experience here.
        </CardContent>
      </Card>
    </div>
  );
};

export default General;
