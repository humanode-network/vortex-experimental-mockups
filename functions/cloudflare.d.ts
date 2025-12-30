type PagesEnv = Record<string, string | undefined>;

type PagesContext<Params = Record<string, string>> = {
  request: Request;
  env: PagesEnv;
  params: Params;
};

type PagesFunction<Params = Record<string, string>> = (
  context: PagesContext<Params>,
) => Response | Promise<Response>;
