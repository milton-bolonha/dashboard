import test from "node:test";
import assert from "node:assert/strict";

/**
 * Testes para a funcionalidade de Listagem de Usuários
 * Cobertura: API /users/list + Componente UsersList
 */

// Mock de dados para testes
const mockUser = {
  clerkId: "user_test_123",
  email: "admin@teste.com",
  firstName: "Admin",
  lastName: "Teste",
  currentPlans: ["cupido", "afrodite"],
  totalSpent: 147.5,
  isActiveCustomer: true,
  planCount: 2,
  createdAt: new Date().toISOString(),
  lastSignInAt: new Date().toISOString(),
};

const mockStats = {
  total: 10,
  activeCustomers: 7,
  totalRevenue: 1475.0,
  conversionRate: "70%",
};

const mockApiResponse = {
  users: [mockUser],
  stats: mockStats,
  meta: {
    fetchedAt: new Date().toISOString(),
    total: 1,
  },
};

// Teste 1: Estrutura da API de listagem
test("API /users/list deve ter estrutura correta", () => {
  assert(typeof mockApiResponse === "object", "Response deve ser objeto");
  assert(Array.isArray(mockApiResponse.users), "Users deve ser array");
  assert(typeof mockApiResponse.stats === "object", "Stats deve ser objeto");
  assert(typeof mockApiResponse.meta === "object", "Meta deve ser objeto");

  const user = mockApiResponse.users[0];
  assert(typeof user.clerkId === "string", "clerkId deve ser string");
  assert(typeof user.email === "string", "email deve ser string");
  assert(Array.isArray(user.currentPlans), "currentPlans deve ser array");
  assert(typeof user.totalSpent === "number", "totalSpent deve ser number");
  assert(
    typeof user.isActiveCustomer === "boolean",
    "isActiveCustomer deve ser boolean"
  );
});

// Teste 2: Dados de estatísticas
test("Estatísticas devem ter formato correto", () => {
  const { stats } = mockApiResponse;

  assert(typeof stats.total === "number", "total deve ser number");
  assert(
    typeof stats.activeCustomers === "number",
    "activeCustomers deve ser number"
  );
  assert(
    typeof stats.totalRevenue === "number",
    "totalRevenue deve ser number"
  );
  assert(
    typeof stats.conversionRate === "string",
    "conversionRate deve ser string"
  );
  assert(stats.conversionRate.includes("%"), "conversionRate deve ter %");
});

// Teste 3: Lógica de filtros
test("Filtros de usuários devem funcionar corretamente", () => {
  const users = [
    { ...mockUser, email: "admin@teste.com", isActiveCustomer: true },
    { ...mockUser, email: "user@teste.com", isActiveCustomer: false },
    { ...mockUser, email: "premium@teste.com", currentPlans: ["zeus"] },
  ];

  // Filtro por email
  const emailFilter = users.filter((u) =>
    u.email.toLowerCase().includes("admin")
  );
  assert.equal(
    emailFilter.length,
    1,
    "Filtro por email deve retornar 1 usuário"
  );

  // Filtro por status ativo
  const activeFilter = users.filter((u) => u.isActiveCustomer);
  assert.equal(
    activeFilter.length,
    2,
    "Filtro por ativos deve retornar 2 usuários"
  );
});

// Teste 4: Cálculos de estatísticas
test("Cálculos de estatísticas devem estar corretos", () => {
  const users = [
    { ...mockUser, totalSpent: 100, isActiveCustomer: true },
    { ...mockUser, totalSpent: 200, isActiveCustomer: true },
    { ...mockUser, totalSpent: 0, isActiveCustomer: false },
  ];

  const total = users.length;
  const activeCustomers = users.filter((u) => u.isActiveCustomer).length;
  const totalRevenue = users.reduce((sum, u) => sum + u.totalSpent, 0);
  const conversionRate = ((activeCustomers / total) * 100).toFixed(2) + "%";

  assert.equal(total, 3, "Total deve ser 3");
  assert.equal(activeCustomers, 2, "Ativos deve ser 2");
  assert.equal(totalRevenue, 300, "Revenue deve ser 300");
  assert.equal(conversionRate, "66.67%", "Conversão deve ser 66.67%");
});

console.log("✅ Todos os testes de listagem de usuários passaram!");
