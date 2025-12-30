export function formatAuthConnectError(input: { message: string }): string {
  const message = input.message;

  if (message.includes("HTTP 404")) {
    return "API is not available at `/api/*`. Start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you only run `yarn dev`, there is no API.";
  }

  if (
    message.includes("Failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("NetworkError") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ECONNRESET")
  ) {
    return "API is not reachable at `/api/*`. If you are running locally, start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you are on a deployed site, check that Pages Functions are deployed and `/api/health` responds.";
  }

  return message;
}
