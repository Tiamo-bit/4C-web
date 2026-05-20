import { onRequest as __api_chat_ts_onRequest } from "E:\\building_puzzle_project\\4C-project\\functions\\api\\chat.ts"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_chat_ts_onRequest],
    },
  ]