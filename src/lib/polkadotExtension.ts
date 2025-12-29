export type PolkadotAccount = {
  address: string;
  name?: string;
  source?: string;
};

type InjectedAccount = {
  address: string;
  meta?: { name?: string; source?: string };
};

type SignRawPayload = {
  address: string;
  data: string;
  type: "bytes";
};

type InjectedSigner = {
  signRaw?: (payload: SignRawPayload) => Promise<{ signature: string }>;
};

type InjectedExtension = {
  accounts?: { get: () => Promise<InjectedAccount[]> };
  signer?: InjectedSigner;
};

type InjectedWeb3 = Record<
  string,
  { enable: (appName: string) => Promise<InjectedExtension> }
>;

const enabled = new Map<string, InjectedExtension>();

function stringToHex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return "0x" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getInjectedWeb3(): InjectedWeb3 | null {
  type GlobalWithInjectedWeb3 = typeof globalThis & {
    injectedWeb3?: InjectedWeb3;
  };
  return (globalThis as GlobalWithInjectedWeb3).injectedWeb3 ?? null;
}

export async function enablePolkadotExtension(
  appName = "Vortex Simulation",
): Promise<boolean> {
  const injected = getInjectedWeb3();
  if (!injected) return false;
  const sources = Object.keys(injected);
  if (!sources.length) return false;

  enabled.clear();
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const ext = await injected[source].enable(appName);
      enabled.set(source, ext);
      return ext;
    }),
  );

  return results.some((r) => r.status === "fulfilled");
}

export async function getPolkadotAccounts(): Promise<PolkadotAccount[]> {
  const entries: PolkadotAccount[] = [];
  for (const [source, ext] of enabled.entries()) {
    const list = (await ext.accounts?.get?.()) ?? [];
    for (const a of list) {
      entries.push({
        address: a.address,
        name: a.meta?.name,
        source: a.meta?.source ?? source,
      });
    }
  }
  return entries;
}

export async function signPolkadotMessage(input: {
  address: string;
  message: string;
}): Promise<string> {
  const data = stringToHex(input.message);

  for (const ext of enabled.values()) {
    const signRaw = ext.signer?.signRaw;
    if (!signRaw) continue;
    try {
      const { signature } = await signRaw({
        address: input.address,
        data,
        type: "bytes",
      });
      return signature;
    } catch {
      // try next extension
    }
  }

  throw new Error(
    "No injected signer was able to sign this message. Is the Polkadot extension connected and the account available?",
  );
}
