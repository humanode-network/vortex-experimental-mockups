import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ProposalCreation: React.FC = () => {
  const [form, setForm] = useState({
    title: "",
    chamber: "",
    proposer: "",
    budget: "",
    formation: "Yes",
    teamSlots: "",
    milestones: "",
    overview: "",
    executionPlan: "",
    budgetScope: "",
    attachments: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="app-page flex flex-col gap-6">
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Create proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-(--text)">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Proposal title"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chamber">Chamber</Label>
              <Input
                id="chamber"
                value={form.chamber}
                onChange={(e) => update("chamber", e.target.value)}
                placeholder="e.g., Protocol chamber"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proposer">Proposer</Label>
              <Input
                id="proposer"
                value={form.proposer}
                onChange={(e) => update("proposer", e.target.value)}
                placeholder="Your name / handle"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="budget">Budget ask</Label>
              <Input
                id="budget"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
                placeholder="e.g., 210k HMND"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formation">Formation (Yes/No)</Label>
              <Input
                id="formation"
                value={form.formation}
                onChange={(e) => update("formation", e.target.value)}
                placeholder="Yes / No"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="teamSlots">Team slots</Label>
              <Input
                id="teamSlots"
                value={form.teamSlots}
                onChange={(e) => update("teamSlots", e.target.value)}
                placeholder="e.g., 3 / 6"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="milestones">Milestones</Label>
              <Input
                id="milestones"
                value={form.milestones}
                onChange={(e) => update("milestones", e.target.value)}
                placeholder="e.g., 2 / 3"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="overview">Proposal overview</Label>
            <textarea
              id="overview"
              className="w-full rounded-lg border border-border bg-panel-alt px-3 py-2 text-sm text-(--text)"
              rows={3}
              value={form.overview}
              onChange={(e) => update("overview", e.target.value)}
              placeholder="Short overview"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="execution">Execution plan</Label>
            <textarea
              id="execution"
              className="w-full rounded-lg border border-border bg-panel-alt px-3 py-2 text-sm text-(--text)"
              rows={3}
              value={form.executionPlan}
              onChange={(e) => update("executionPlan", e.target.value)}
              placeholder="Steps, timeline, checkpoints"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="budgetScope">Budget & scope</Label>
            <textarea
              id="budgetScope"
              className="w-full rounded-lg border border-border bg-panel-alt px-3 py-2 text-sm text-(--text)"
              rows={3}
              value={form.budgetScope}
              onChange={(e) => update("budgetScope", e.target.value)}
              placeholder="What the budget covers; scope notes"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="attachments">Attachments</Label>
            <textarea
              id="attachments"
              className="w-full rounded-lg border border-border bg-panel-alt px-3 py-2 text-sm text-(--text)"
              rows={2}
              value={form.attachments}
              onChange={(e) => update("attachments", e.target.value)}
              placeholder="Links to PDFs, docs, sheets…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
            <Button size="sm">Create proposal</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalCreation;
