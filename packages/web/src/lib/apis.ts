import { createFetchClient, todosContract } from "@kilonode-demo-app/common";

export const todosApi = createFetchClient(todosContract, { baseUrl: "/api" });