import db from '../config/database';
import { Store } from '../models/store.model';

async function create(data: Omit<Store, 'created_at' | 'updated_at'>): Promise<Store> {
  await db('stores').insert({
    id: data.id,
    type: data.type,
    name: data.name ?? null,
    namespace: data.namespace,
    status: data.status,
    url: data.url ?? null,
    admin_url: data.admin_url ?? null,
    error_message: data.error_message ?? null,
    user_id: data.user_id ?? null
  });
  const row = await findById(data.id);
  if (!row) throw new Error('Failed to create store');
  return row;
}

async function findAll(): Promise<Store[]> {
  return db('stores').orderBy('created_at', 'desc');
}

async function findByUserId(userId: string): Promise<Store[]> {
  return db('stores').where({ user_id: userId }).orderBy('created_at', 'desc');
}

async function findById(id: string): Promise<Store | null> {
  const row = await db('stores').where({ id }).first();
  return row ?? null;
}

async function updateStatus(
  id: string,
  status: string,
  errorMessage?: string | null,
  url?: string | null,
  adminUrl?: string | null
): Promise<void> {
  await db('stores').where({ id }).update({
    status,
    ...(errorMessage !== undefined && { error_message: errorMessage }),
    ...(url !== undefined && { url }),
    ...(adminUrl !== undefined && { admin_url: adminUrl }),
    updated_at: db.fn.now()
  });
}

async function deleteById(id: string): Promise<void> {
  await db('stores').where({ id }).del();
}

async function count(): Promise<number> {
  const result = await db('stores').count('* as total').first();
  return Number((result as { total: string })?.total ?? 0);
}

async function countByUserId(userId: string): Promise<number> {
  const result = await db('stores')
    .where({ user_id: userId })
    .whereNotIn('status', ['Deleting'])
    .count('* as total')
    .first();
  return Number((result as { total: string })?.total ?? 0);
}

async function findByNamespace(namespace: string): Promise<Store | null> {
  const row = await db('stores').where({ namespace }).first();
  return row ?? null;
}

export default {
  create,
  findAll,
  findByUserId,
  findById,
  updateStatus,
  deleteById,
  count,
  countByUserId,
  findByNamespace
};
