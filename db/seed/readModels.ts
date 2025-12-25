import { chambers } from "./fixtures/chambers.ts";
import {
  chamberChatLog,
  chamberGovernors,
  chamberProposals,
  chamberThreads,
  proposalStageOptions,
} from "./fixtures/chamberDetail.ts";
import { courtCases } from "./fixtures/courts.ts";
import { factions } from "./fixtures/factions.ts";
import { formationMetrics, formationProjects } from "./fixtures/formation.ts";
import { humanNodes } from "./fixtures/humanNodes.ts";
import { humanNodeProfilesById } from "./fixtures/humanNodeProfiles.ts";
import {
  invisionChamberProposals,
  invisionEconomicIndicators,
  invisionGovernanceState,
  invisionRiskSignals,
} from "./fixtures/invision.ts";
import { eraActivity, myChamberIds } from "./fixtures/myGovernance.ts";
import { proposalDraftDetails } from "./fixtures/proposalDraft.ts";
import { proposals } from "./fixtures/proposals.ts";
import { feedItemsApi } from "./fixtures/feedApi.ts";
import {
  chamberProposalPageById,
  formationProposalPageById,
  poolProposalPageById,
} from "./fixtures/proposalPages.ts";

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

  entries.push({ key: "feed:list", payload: { items: feedItemsApi } });

  entries.push({ key: "factions:list", payload: { items: factions } });
  for (const faction of factions) {
    entries.push({ key: `factions:${faction.id}`, payload: faction });
  }

  entries.push({
    key: "formation:directory",
    payload: { metrics: formationMetrics, projects: formationProjects },
  });

  entries.push({
    key: "invision:dashboard",
    payload: {
      governanceState: invisionGovernanceState,
      economicIndicators: invisionEconomicIndicators,
      riskSignals: invisionRiskSignals,
      chamberProposals: invisionChamberProposals,
    },
  });

  entries.push({
    key: "my-governance:summary",
    payload: { eraActivity, myChamberIds },
  });

  entries.push({
    key: "proposals:drafts:list",
    payload: {
      items: [
        {
          id: "draft-vortex-ux-v1",
          title: proposalDraftDetails.title,
          chamber: proposalDraftDetails.chamber,
          tier: proposalDraftDetails.tier,
          summary: proposalDraftDetails.summary,
          updated: "2026-01-09",
        },
      ],
    },
  });
  entries.push({
    key: "proposals:drafts:draft-vortex-ux-v1",
    payload: proposalDraftDetails,
  });

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
