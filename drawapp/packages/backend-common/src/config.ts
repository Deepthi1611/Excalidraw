export function getJwtSecret(): string | undefined {
  return process.env.JWT_SECRET;
}