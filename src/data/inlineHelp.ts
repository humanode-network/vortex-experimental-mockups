export type InlineHelpRegistry = Record<string, Record<string, string>>;

export const inlineHelp: InlineHelpRegistry = {
  chambers: {
    metrics:
      "A quick snapshot of chamber activity for this era (mock data) to help you spot where attention is needed.",
    filters:
      "Use filters to find chambers with active proposal pools, votes, or Formation work.",
    cards:
      "M × is the chamber multiplier used in CM calculations; the pipeline shows how many items are in pool, vote, and Formation.",
  },
};

export const getInlineHelp = (
  pageId: string,
  sectionId: string,
): string | undefined => inlineHelp[pageId]?.[sectionId];
