import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vortexopediaTerms } from "@/data/vortexopedia";
import { cn } from "@/lib/utils";

const Vortexopedia: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(vortexopediaTerms.map((t) => t.category));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vortexopediaTerms.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const text = [
        item.name,
        item.id,
        item.short,
        ...item.long,
        ...item.tags,
        ...item.related,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = term.length === 0 || text.includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="app-page flex flex-col gap-6">
      <Card className="bg-panel border border-border">
        <CardHeader className="pb-2">
          <CardTitle>Vortexopedia</CardTitle>
          <p className="text-xs text-muted">
            Dictionary of Vortex terminology with search and quick filters.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by term, tag, or description…"
              className="md:max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const btnVariant = (
                  activeCategory === cat ? "primary" : "outline"
                ) as "primary" | "outline";
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={btnVariant}
                    className={cn(
                      "rounded-full border border-border text-xs",
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "bg-panel-alt text-(--text)",
                    )}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === "all" ? "All categories" : cat}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-muted">
            Showing {filtered.length} / {vortexopediaTerms.length} entries
          </div>

          <div className="grid gap-3">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "bg-panel-alt border border-border transition-colors hover:border-primary/60",
                  expandedId === item.id && "border-primary",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => toggleExpand(item.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <p className="text-[0.75rem] tracking-wide text-muted uppercase">
                          Ref {item.ref} · {item.category}
                        </p>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="rounded-full border border-border px-2 py-1">
                          ID: {item.id}
                        </span>
                        <span className="rounded-full border border-border px-2 py-1">
                          Updated: {item.updated}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-(--text)">{item.short}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-panel rounded-full border border-border px-2 py-0.5 text-[0.7rem] tracking-wide text-muted uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                </button>
                {expandedId === item.id && (
                  <CardContent className="space-y-3 text-sm text-(--text)">
                    <div className="space-y-1">
                      <p className="font-semibold">Details</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted">
                        {item.long.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    {item.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold">Examples / usage</p>
                        <ul className="list-disc space-y-1 pl-5 text-muted">
                          {item.examples.map((ex, idx) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.stages.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold">Stages / context</p>
                        <div className="flex flex-wrap gap-2">
                          {item.stages.map((stage) => (
                            <span
                              key={stage}
                              className="bg-panel rounded-full border border-border px-2 py-0.5 text-[0.75rem] text-muted"
                            >
                              {stage}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.related.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold">Related terms</p>
                        <div className="flex flex-wrap gap-2">
                          {item.related.map((rel) => (
                            <span
                              key={rel}
                              className="bg-panel rounded-full border border-border px-2 py-0.5 text-[0.75rem] text-muted"
                            >
                              {rel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.links.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold">Links</p>
                        <div className="flex flex-wrap gap-2">
                          {item.links.map((link) => (
                            <a
                              key={link.url}
                              className="bg-panel rounded-full border border-border px-2 py-0.5 text-[0.75rem] text-primary hover:border-primary"
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted">
                      Source: {item.source}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vortexopedia;
