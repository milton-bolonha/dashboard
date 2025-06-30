import { mock } from "node:test";
import { ObjectId } from "mongodb";

// O módulo que queremos mockar
import * as clerk from "@clerk/nextjs/server";

// Guarda a implementação original
const originalAuth = clerk.auth;

// Mock de dados do usuário
const mockUser = {
  id: new ObjectId().toHexString(),
  firstName: "Test",
  lastName: "User",
};

/**
 * Inicia o mock da função auth() do Clerk.
 * Faz a função retornar um userId de teste.
 */
export function setup() {
  console.log("🎭 Mocking Clerk auth...");
  mock.method(clerk, "auth", () => {
    return {
      userId: mockUser.id,
      sessionId: `test_session_${new ObjectId()}`,
      getToken: async () => "mock_jwt_token",
    };
  });

  return { user: mockUser, token: "mock_jwt_token" };
}

/**
 * Restaura a função auth() original do Clerk.
 */
export function teardown() {
  console.log("🧹 Restoring original Clerk auth...");
  mock.restoreAll();
}
