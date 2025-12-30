// Minimal Cloudflare Pages Functions types for editor/typecheck support.
// We keep this local (instead of depending on @cloudflare/workers-types) to
// avoid adding heavy dependencies while still getting basic safety.

type PagesFunction<Env = Record<string, unknown>> = (context: {
  request: Request;
  env: Env;
  params?: Record<string, string | undefined>;
}) => Response | Promise<Response>;
