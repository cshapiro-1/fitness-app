export async function logActivity(_input: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  clientId?: string | null;
  details?: Record<string, unknown>;
}) {
  return null;
}
