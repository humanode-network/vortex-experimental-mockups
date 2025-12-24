export function formatAuthConnectError(input: { message: string }): string {
  if (input.message.includes("HTTP 404")) {
    return "API is not available at `/api/*`. Start the backend with `yarn dev:api` (after `yarn build`) or run `yarn dev:full`. If you only run `yarn dev`, there is no API.";
  }

  return input.message;
}
