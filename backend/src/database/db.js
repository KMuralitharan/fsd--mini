import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'root',
  DB_NAME = 'englishconnect'
} = process.env;

let pool = null;

export async function getDbPool() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    // Test connection
    const conn = await pool.getConnection();
    conn.release();
    return pool;
  } catch (err) {
    console.error('MySQL Pool Error:', err.message);
    throw err;
  }
}

export async function executeQuery(sql, params = []) {
  const p = await getDbPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await executeQuery(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}
