import crypto from 'crypto';

export function generateStoreId(length = 12): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

export function generatePassword(length = 24): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'store';
}

export function namespaceFromSlug(slug: string, uniqueSuffix?: string): string {
  const base = `store-${slug}`;
  return uniqueSuffix ? `${base}-${uniqueSuffix}` : base;
}
