import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("my-governance:summary");
    return jsonResponse(
      payload ?? {
        eraActivity: {
          era: "Era 0",
          required: 0,
          completed: 0,
          actions: [],
          timeLeft: "—",
        },
        myChamberIds: [],
      },
    );
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};
