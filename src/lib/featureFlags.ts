const raw = import.meta.env.VITE_SIM_AUTH;

export const SIM_AUTH_ENABLED = raw ? raw === "true" : true;
