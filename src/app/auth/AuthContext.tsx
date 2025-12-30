import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  apiMe,
  apiNonce,
  apiLogout,
  apiVerify,
  type ApiMeResponse,
} from "@/lib/apiClient";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { formatAuthConnectError } from "@/app/auth/connectErrors";
import {
  enablePolkadotExtension,
  getPolkadotAccounts,
  signPolkadotMessage,
} from "@/lib/polkadotExtension";

type AuthState = {
  enabled: boolean;
  loading: boolean;
  authenticated: boolean;
  address: string | null;
  eligible: boolean;
  gateReason?: string;
  lastError: string | null;
};

type AuthActions = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "vortex:auth:selectedAddress";

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const enabled = SIM_AUTH_ENABLED;
  const [loading, setLoading] = useState<boolean>(enabled);
  const [authenticated, setAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [gateReason, setGateReason] = useState<string | undefined>(undefined);
  const [lastSelectedAddress, setLastSelectedAddress] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<ApiMeResponse | null> => {
    if (!enabled) return null;
    setLoading(true);
    setLastError(null);
    try {
      const next = await apiMe();
      if (next.authenticated) {
        setAuthenticated(true);
        setAddress(next.address);
        setEligible(next.gate.eligible);
        setGateReason(next.gate.eligible ? undefined : next.gate.reason);
      } else {
        setAuthenticated(false);
        setAddress(null);
        setEligible(false);
        setGateReason(undefined);
      }
      return next;
    } catch (error) {
      setLastError(
        formatAuthConnectError({ message: (error as Error).message }),
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!enabled) return;
    setLastError(null);
    setLoading(true);
    try {
      const ok = await enablePolkadotExtension("Vortex");
      if (!ok) {
        setLastError(
          "Polkadot extension not found or not enabled (or permission was denied).",
        );
        return;
      }
      const list = await getPolkadotAccounts();
      if (!list.length) {
        setLastError("No accounts found in the Polkadot extension.");
        return;
      }
      const candidate =
        (lastSelectedAddress &&
          list.find((a) => a.address === lastSelectedAddress)?.address) ||
        list[0].address;

      const { nonce } = await apiNonce(candidate);
      const signature = await signPolkadotMessage({
        address: candidate,
        message: nonce,
      });
      await apiVerify({ address: candidate, nonce, signature });

      setLastSelectedAddress(candidate);
      try {
        localStorage.setItem(STORAGE_KEY, candidate);
      } catch {
        // ignore
      }

      const next = await refresh();
      if (!next?.authenticated) {
        const isHttp = window.location.protocol === "http:";
        setLastError(
          isHttp
            ? "Connected, but the auth cookie was not stored (HTTP). Use `wrangler pages dev ... --local-protocol=https` or set `DEV_INSECURE_COOKIES=true` for local dev."
            : "Connected, but the auth cookie was not stored. Check that Pages Functions are running and cookies are allowed.",
        );
      }
    } catch (error) {
      setLastError(
        formatAuthConnectError({ message: (error as Error).message }),
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, lastSelectedAddress, refresh]);

  const disconnect = useCallback(async () => {
    if (!enabled) return;
    setLastError(null);
    setLoading(true);
    try {
      await apiLogout();
      await refresh();
    } catch (error) {
      setLastError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const handle = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(handle);
  }, [enabled, refresh]);

  const value: AuthContextValue = {
    enabled,
    loading,
    authenticated,
    address,
    eligible,
    gateReason,
    lastError,
    connect,
    disconnect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      enabled: false,
      loading: false,
      authenticated: false,
      address: null,
      eligible: false,
      gateReason: undefined,
      lastError: null,
      connect: async () => {},
      disconnect: async () => {},
    };
  }
  return ctx;
}

export function AuthSidebarPanel() {
  const auth = useAuth();
  if (!auth.enabled) return null;

  const addressLabel = auth.address
    ? shortAddress(auth.address)
    : "Not connected";
  const gateLabel =
    auth.authenticated && auth.eligible ? "Active" : "Not active";

  const gateError =
    auth.authenticated && !auth.eligible
      ? auth.gateReason === "rpc_not_configured"
        ? "Gate RPC is not configured. Set `HUMANODE_RPC_URL` in the Pages environment or set `humanodeRpcUrl` in `/sim-config.json` (or use `DEV_BYPASS_GATE=true` for local dev)."
        : auth.gateReason === "rpc_error"
          ? "Gate RPC request failed. Check that `HUMANODE_RPC_URL` (or `/sim-config.json`) is reachable and supports `state_getStorage`."
          : null
      : null;

  return (
    <div className="sidebar__auth">
      <div className="sidebar__authRow">
        <span className="sidebar__authKicker">Wallet</span>
        <span className="sidebar__authValue">{addressLabel}</span>
      </div>
      <div className="sidebar__authRow">
        <span className="sidebar__authKicker">Status</span>
        <span
          className={
            auth.authenticated && auth.eligible
              ? "sidebar__authValue sidebar__authValue--ok"
              : "sidebar__authValue sidebar__authValue--warn"
          }
          title={auth.gateReason}
        >
          {gateLabel}
        </span>
      </div>

      {auth.lastError ? (
        <div className="sidebar__authError" role="status">
          {auth.lastError}
        </div>
      ) : gateError ? (
        <div className="sidebar__authError" role="status">
          {gateError}
        </div>
      ) : null}

      <div className="sidebar__authButtons">
        {auth.authenticated ? (
          <button
            type="button"
            className="sidebar__authBtn sidebar__authBtn--ghost"
            disabled={auth.loading}
            onClick={() => void auth.disconnect()}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            className="sidebar__authBtn"
            disabled={auth.loading}
            onClick={() => void auth.connect()}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
