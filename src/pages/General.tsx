import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";

const General: React.FC = () => {
  return (
    <AppPage>
      <PageHeader
        title="General"
        description="Global preferences and account options."
      />
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Configure your experience here.
        </CardContent>
      </Card>
    </AppPage>
  );
};

export default General;
