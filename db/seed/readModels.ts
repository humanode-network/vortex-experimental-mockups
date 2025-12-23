import { chambers } from "../../src/data/mock/chambers.ts";
import {
  chamberChatLog,
  chamberGovernors,
  chamberProposals,
  chamberThreads,
  proposalStageOptions,
} from "../../src/data/mock/chamberDetail.ts";
import { courtCases } from "../../src/data/mock/courts.ts";
import { humanNodes } from "../../src/data/mock/humanNodes.ts";
import { humanNodeProfilesById } from "../../src/data/mock/humanNodeProfiles.ts";
import { proposals } from "../../src/data/mock/proposals.ts";
import {
  chamberProposalPageById,
  formationProposalPageById,
  poolProposalPageById,
} from "../../src/data/mock/proposalPages.ts";

export type ReadModelSeedEntry = { key: string; payload: unknown };

export function buildReadModelSeed(): ReadModelSeedEntry[] {
  const entries: ReadModelSeedEntry[] = [];

  entries.push({ key: "chambers:list", payload: { items: chambers } });

  entries.push({
    key: "chambers:engineering",
    payload: {
      proposals: chamberProposals,
      governors: chamberGovernors,
      threads: chamberThreads,
      chatLog: chamberChatLog,
      stageOptions: proposalStageOptions,
    },
  });

  entries.push({ key: "proposals:list", payload: { items: proposals } });

  entries.push({
    key: "courts:list",
    payload: {
      items: courtCases.map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        triggeredBy: c.triggeredBy,
        status: c.status,
        reports: c.reports,
        juryIds: c.juryIds,
        opened: c.opened,
      })),
    },
  });

  for (const c of courtCases)
    entries.push({ key: `courts:${c.id}`, payload: c });

  entries.push({ key: "humans:list", payload: { items: humanNodes } });

  for (const [id, profile] of Object.entries(humanNodeProfilesById)) {
    entries.push({ key: `humans:${id}`, payload: profile });
  }

  for (const proposal of proposals) {
    const id = proposal.id;
    const poolPage = poolProposalPageById(id);
    const chamberPage = chamberProposalPageById(id);
    const formationPage = formationProposalPageById(id);

    if (poolPage)
      entries.push({ key: `proposals:${id}:pool`, payload: poolPage });
    if (chamberPage)
      entries.push({ key: `proposals:${id}:chamber`, payload: chamberPage });
    if (formationPage)
      entries.push({
        key: `proposals:${id}:formation`,
        payload: formationPage,
      });
  }

  return entries;
}
