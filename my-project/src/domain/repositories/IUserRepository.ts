export interface IUserRepository {
  create(data: { name: string; email: string; password: string }): Promise<{ id: number; name: string; email: string }>;
  findByEmail(email: string): Promise<{ id: number; email: string; password: string } | null>;
}
