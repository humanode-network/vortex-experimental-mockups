import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getChamber } from "../../_lib/chambersStore.ts";
import { listProposals } from "../../_lib/proposalsStore.ts";
import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import {
  listAllChamberMembers,
  listChamberMembers,
} from "../../_lib/chamberMembershipsStore.ts";
import { getSimConfig } from "../../_lib/simConfig.ts";
import { resolveUserTierFromSimConfig } from "../../_lib/userTier.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing chamber id");
    if (context.env.READ_MODELS_INLINE_EMPTY === "true") {
      const store = await createReadModelsStore(context.env).catch(() => null);
      const fallback = store ? await store.get(`chambers:${id}`) : null;
      if (!fallback) return errorResponse(404, "Chamber not found");
    }

    let chamber = await getChamber(context.env, context.request.url, id);
    if (!chamber) {
      const store = await createReadModelsStore(context.env).catch(() => null);
      const listPayload = store ? await store.get("chambers:list") : null;
      const items =
        listPayload &&
        typeof listPayload === "object" &&
        !Array.isArray(listPayload) &&
        Array.isArray((listPayload as { items?: unknown[] }).items)
          ? (listPayload as { items: unknown[] }).items
          : [];
      const entry = items.find(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          String((item as { id?: string }).id ?? "").toLowerCase() ===
            id.toLowerCase(),
      ) as
        | {
            id?: string;
            name?: string;
            multiplier?: number;
            status?: string;
          }
        | undefined;
      if (entry) {
        const multiplier =
          typeof entry.multiplier === "number" ? entry.multiplier : 1;
        const now = new Date();
        chamber = {
          id: String(entry.id ?? id).toLowerCase(),
          title: entry.name ?? entry.id ?? id,
          status:
            entry.status === "dissolved" ? "dissolved" : ("active" as const),
          multiplierTimes10: Math.round(multiplier * 10),
          createdAt: now,
          updatedAt: now,
          dissolvedAt: null,
        };
      }
    }
    if (!chamber) return errorResponse(404, "Chamber not found");

    const stageOptions = [
      { value: "upcoming", label: "Upcoming" },
      { value: "live", label: "Live" },
      { value: "ended", label: "Ended" },
    ] as const;

    const proposalsList: Array<{
      id: string;
      title: string;
      meta: string;
      summary: string;
      lead: string;
      nextStep: string;
      timing: string;
      stage: "upcoming" | "live" | "ended";
    }> = [];

    const proposalRows = await listProposals(context.env);
    for (const proposal of proposalRows) {
      if ((proposal.chamberId ?? "general").toLowerCase() !== id.toLowerCase())
        continue;
      const stage =
        proposal.stage === "pool"
          ? "upcoming"
          : proposal.stage === "vote"
            ? "live"
            : "ended";
      const formationEligible = (() => {
        const payload = proposal.payload as Record<string, unknown> | null;
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
          return true;
        if (payload.templateId === "system") return false;
        if (
          typeof payload.metaGovernance === "object" &&
          payload.metaGovernance !== null &&
          !Array.isArray(payload.metaGovernance)
        )
          return false;
        if (typeof payload.formationEligible === "boolean")
          return payload.formationEligible;
        if (typeof payload.formation === "boolean") return payload.formation;
        return true;
      })();

      const meta =
        stage === "upcoming"
          ? "Proposal pool"
          : stage === "live"
            ? "Chamber vote"
            : formationEligible
              ? "Formation"
              : "Passed";

      proposalsList.push({
        id: proposal.id,
        title: proposal.title,
        meta,
        summary: proposal.summary,
        lead: chamber.title,
        nextStep:
          stage === "upcoming"
            ? "Cast attention vote"
            : stage === "live"
              ? "Cast chamber vote"
              : formationEligible
                ? "Open Formation"
                : "Read outcome",
        timing: proposal.createdAt.toISOString().slice(0, 10),
        stage,
      });
    }

    const cfg = await getSimConfig(context.env, context.request.url);
    const genesisMembers = cfg?.genesisChamberMembers ?? undefined;
    const memberAddresses = new Set<string>();
    const normalizeAddress = (value: string) => value.trim();
    const chamberId = id.toLowerCase();

    if (chamberId === "general") {
      if (genesisMembers) {
        for (const list of Object.values(genesisMembers)) {
          for (const addr of list) memberAddresses.add(normalizeAddress(addr));
        }
      }
      // In v1, the roster for General is the set of anyone with any membership.
      // This will be refined once canonical human profiles and era activity are in place.
      const seeded = await listAllChamberMembers(context.env);
      for (const addr of seeded) memberAddresses.add(normalizeAddress(addr));
    } else {
      if (genesisMembers) {
        for (const addr of genesisMembers[chamberId] ?? [])
          memberAddresses.add(normalizeAddress(addr));
      }
      const seeded = await listChamberMembers(context.env, id);
      for (const addr of seeded) memberAddresses.add(normalizeAddress(addr));
    }

    const governors = await Promise.all(
      Array.from(memberAddresses)
        .sort()
        .map(async (address) => ({
          id: address,
          name:
            address.length > 12
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : address,
          tier: await resolveUserTierFromSimConfig(cfg, address),
          focus: chamber.title,
        })),
    );

    return jsonResponse({
      proposals: proposalsList.sort((a, b) => a.title.localeCompare(b.title)),
      governors,
      threads: [],
      chatLog: [],
      stageOptions,
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
