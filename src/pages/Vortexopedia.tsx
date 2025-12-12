import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBar } from "@/components/SearchBar";
import { vortexopediaTerms } from "@/data/vortexopedia";
import { cn } from "@/lib/utils";

const Vortexopedia: React.FC = () => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("any");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");

  const categories = useMemo(
    () => Array.from(new Set(vortexopediaTerms.map((t) => t.category))),
    [],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...vortexopediaTerms]
      .filter((item) => {
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
        const matchesText = term.length === 0 || text.includes(term);
        const matchesCategory =
          category === "any" ? true : item.category === category;
        return matchesText && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.updated.localeCompare(a.updated);
      });
  }, [search, category, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("term");
    if (q) {
      const exists = vortexopediaTerms.find((t) => t.id === q);
      if (exists) {
        setExpandedId(exists.id);
        const el = document.querySelector(`[data-term-id="${exists.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, [location.search]);

  return (
    <div className="app-page flex flex-col gap-6">
      <Card className="bg-panel border border-border">
        <CardHeader className="pb-2">
          <CardTitle>Vortexopedia</CardTitle>
          <p className="text-xs text-muted">
            Dictionary of Vortex terminology.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by term, tag, or description…"
            ariaLabel="Search terms"
            className="w-full"
            filtersConfig={[
              {
                key: "category",
                label: "Category",
                options: [
                  { value: "any", label: "Any category" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ],
              },
              {
                key: "sortBy",
                label: "Sort by",
                options: [
                  { value: "name", label: "Name (A–Z)" },
                  { value: "updated", label: "Updated (newest)" },
                ],
              },
            ]}
            filtersState={{ category, sortBy }}
            onFiltersChange={(next) => {
              if (next.category) setCategory(next.category);
              if (next.sortBy) setSortBy(next.sortBy as "name" | "updated");
            }}
          />

          <div className="text-xs text-muted">
            Showing {filtered.length} / {vortexopediaTerms.length} entries
          </div>

          <div className="grid gap-3">
            {filtered.map((item) => (
              <Card
                key={item.id}
                data-term-id={item.id}
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
                    <p className="text-sm text-foreground">{item.short}</p>
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
                  <CardContent className="space-y-3 text-sm text-foreground">
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
