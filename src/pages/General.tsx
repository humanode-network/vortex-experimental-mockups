import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { PageHeader } from "@/components/PageHeader";
import { ToggleGroup } from "@/components/ToggleGroup";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";

const General: React.FC = () => {
  const [theme, setThemeState] = useState<Theme>(
    () => getStoredTheme() ?? "sky",
  );

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="General"
        description="Global preferences and account options."
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-text">Theme</p>
              <p className="text-sm text-muted">
                Sky/Light affect the main UI; Night also darkens the sidebar.
              </p>
            </div>
            <ToggleGroup
              value={theme}
              onValueChange={(val) => setThemeState(val as Theme)}
              options={[
                { value: "sky", label: "Sky" },
                { value: "light", label: "Light" },
                { value: "night", label: "Night" },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default General;
