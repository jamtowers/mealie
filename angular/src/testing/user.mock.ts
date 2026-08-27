import type { UserOut } from "@api/models/user-out";

export function createMockUser(overrides: Partial<UserOut> = {}): UserOut {
  return {
    id: "user-1",
    username: "testuser",
    fullName: "Test User",
    email: "user@example.com",
    group: "group-1",
    household: "household-1",
    groupId: "group-1",
    groupSlug: "group-slug",
    householdId: "household-1",
    householdSlug: "household-slug",
    cacheKey: "cache-key",
    ...overrides,
  };
}
