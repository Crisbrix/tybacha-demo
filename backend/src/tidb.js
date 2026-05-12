import fs from "node:fs";
import mysql from "mysql2/promise";

const sslCaPath = process.env.TIDB_SSL_CA_PATH;

export const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  ssl: sslCaPath && fs.existsSync(sslCaPath) ? { ca: fs.readFileSync(sslCaPath) } : { rejectUnauthorized: true }
});
