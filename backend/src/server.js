import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "./tidb.js";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || "development-secret";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, roles: user.roles || [] }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  });
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.length || roles.some((role) => req.auth.roles?.includes(role))) return next();
    return res.status(403).json({ error: "Permisos insuficientes" });
  };
}

async function audit(userId, action, entity, detail) {
  await pool.execute(
    "INSERT INTO audit_logs (user_id, action, entity, new_value) VALUES (?, ?, ?, ?)",
    [userId || null, action, entity, detail || null]
  );
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tybacha-api" });
});

app.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        fullName: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8),
        phone: z.string().optional()
      })
      .parse(req.body);

    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [body.email]);
    if (existing.length) return res.status(409).json({ error: "Ya existe un usuario con ese correo" });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [created] = await connection.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", [body.email, passwordHash]);
      await connection.execute("INSERT INTO profiles (user_id, full_name, phone) VALUES (?, ?, ?)", [created.insertId, body.fullName, body.phone || null]);
      await connection.execute("INSERT INTO user_roles (user_id, role_id) VALUES (?, 'professional')", [created.insertId]);
      await connection.execute("INSERT INTO audit_logs (user_id, action, entity, new_value) VALUES (?, 'Registro usuario', 'users', ?)", [created.insertId, body.email]);
      await connection.commit();
      res.status(201).json({ token: signToken({ id: created.insertId, email: body.email, roles: ["professional"] }) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1), rememberMe: z.boolean().optional() }).parse(req.body);
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.password_hash, GROUP_CONCAT(ur.role_id) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = ? AND u.status = 'Activo'
       GROUP BY u.id`,
      [body.email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }
    const roles = user.roles ? user.roles.split(",") : [];
    await pool.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
    await audit(user.id, "Inicio sesion", "sessions", body.rememberMe ? "remember_me" : "standard");
    res.json({ token: signToken({ ...user, roles }), user: { id: user.id, email: user.email, roles } });
  })
);

app.get(
  "/older-adults",
  authenticate,
  requireRole("admin", "professional", "caregiver"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, birth_date, gender, status, phone, address, emergency_contact
       FROM older_adults
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 50`
    );
    res.json({ data: rows });
  })
);

app.post(
  "/older-adults",
  authenticate,
  requireRole("admin", "professional"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        birthDate: z.string(),
        gender: z.string().min(1),
        phone: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional()
      })
      .parse(req.body);
    const [created] = await pool.execute(
      `INSERT INTO older_adults
       (first_name, last_name, birth_date, gender, phone, address, emergency_contact, professional_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [body.firstName, body.lastName, body.birthDate, body.gender, body.phone || null, body.address || null, body.emergencyContact || null, req.auth.sub]
    );
    await audit(req.auth.sub, "Creo adulto mayor", "older_adults", String(created.insertId));
    res.status(201).json({ id: created.insertId });
  })
);

app.patch(
  "/older-adults/:id/status",
  authenticate,
  requireRole("admin", "professional"),
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.enum(["Activo", "Inactivo"]) }).parse(req.body);
    await pool.execute("UPDATE older_adults SET status = ? WHERE id = ?", [body.status, req.params.id]);
    await audit(req.auth.sub, "Cambio estado adulto mayor", "older_adults", `${req.params.id}:${body.status}`);
    res.json({ ok: true });
  })
);

app.post(
  "/plans/generate",
  authenticate,
  requireRole("admin", "professional"),
  asyncHandler(async (req, res) => {
    const body = z.object({ olderAdultId: z.number().int().positive() }).parse(req.body);
    const exercises = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"].map((day, index) => ({
      day,
      name: ["Movilidad articular", "Caminata segura", "Fuerza funcional", "Equilibrio asistido", "Estiramiento y respiracion"][index],
      durationMinutes: index === 1 ? 20 : 12,
      intensity: "Baja",
      status: "Pendiente"
    }));
    await audit(req.auth.sub, "Genero plan IA", "exercise_plans", String(body.olderAdultId));
    res.json({ source: "Gemini AI", exercises });
  })
);

app.use((error, _req, res, _next) => {
  logger.error(error);
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Datos invalidos", details: error.flatten() });
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(port, () => {
  logger.info({ port }, "Tybacha API running");
});
