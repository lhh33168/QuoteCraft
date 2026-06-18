export type SessionUser = {
  id: string;
  email: string;
};

export async function requireUser(): Promise<SessionUser> {
  return {
    id: "mock-user-id",
    email: "hello@quotecraft.cn"
  };
}
