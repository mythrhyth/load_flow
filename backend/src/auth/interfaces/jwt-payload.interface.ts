export class JwtPayload {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
  permissions: string[];
}
