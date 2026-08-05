// backend/db.js
// Pool di connessione condiviso. Ogni servizio importa `pool` o `withTransaction`.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

/**
 * Esegue una serie di operazioni all'interno di una singola transazione.
 * Se `fn` lancia un errore, viene eseguito il ROLLBACK automatico.
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
