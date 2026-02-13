import path from 'path';
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: 'localhost',
      port: 5432,
      user: 'storeweaver',
      password: 'storeweaver123',
      database: 'storeweaver'
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, '../migrations'),
      tableName: 'knex_migrations',
      extension: 'js'
    }
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, '../migrations'),
      tableName: 'knex_migrations',
      extension: 'js'
    }
  }
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
