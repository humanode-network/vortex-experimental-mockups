import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { SearchBar } from "@/components/SearchBar";
import { vortexopediaTerms } from "@/data/vortexopedia";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/Pill";
import { Kicker } from "@/components/Kicker";

const Vortexopedia: React.FC = () => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    category: string;
    sortBy: "name" | "updated";
  }>({ category: "any", sortBy: "name" });
  const { category, sortBy } = filters;

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
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
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
          filtersState={filters}
          onFiltersChange={setFilters}
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
                "border border-border bg-panel-alt transition-colors hover:border-primary/60",
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
                      <Kicker className="text-[0.75rem]">
                        Ref {item.ref} · {item.category}
                      </Kicker>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Pill
                        size="sm"
                        tone="muted"
                        className="px-2 py-1 text-xs"
                      >
                        ID: {item.id}
                      </Pill>
                      <Pill
                        size="sm"
                        tone="muted"
                        className="px-2 py-1 text-xs"
                      >
                        Updated: {item.updated}
                      </Pill>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{item.short}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Pill
                        key={tag}
                        tone="muted"
                        size="xs"
                        className="uppercase"
                      >
                        {tag}
                      </Pill>
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
                          <Pill key={stage} tone="muted" size="xs">
                            {stage}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.related.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-semibold">Related terms</p>
                      <div className="flex flex-wrap gap-2">
                        {item.related.map((rel) => (
                          <Pill key={rel} tone="muted" size="xs">
                            {rel}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.links.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-semibold">Links</p>
                      <div className="flex flex-wrap gap-2">
                        {item.links.map((link) => (
                          <Pill
                            key={link.url}
                            as="a"
                            tone="primary"
                            size="xs"
                            className="hover:border-primary"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                          </Pill>
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
      </div>
    </div>
  );
};

export default Vortexopedia;
