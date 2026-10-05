import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { createHash, randomBytes } from 'node:crypto';
import url from 'node:url';
import { getSqlPool } from './db.js';

const app = express();
const PORT = process.env.PORT || 8081;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('origin_not_allowed'));
  },
}));
app.use(express.json({ limit: '32kb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'repair-cafe-api' }));

app.get('/volunteers', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const result = await pool.request().query(`
      SELECT id, name, specialty, bio
      FROM volunteers
      WHERE active = 1
      ORDER BY name
    `);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.get('/appointments', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const result = await pool.request().query(`
      SELECT a.id, a.repair_type, a.slot,
             v.name AS volunteer_name, v.specialty
      FROM repair_appointments a
      JOIN volunteers v ON v.id = a.volunteer_id
      ORDER BY a.slot
    `);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.post('/appointments', async (req, res, next) => {
  const body = req.body || {};
  const volunteerId = Number(body.volunteer_id);
  const visitorName = typeof body.visitor_name === 'string' ? body.visitor_name.trim() : '';
  const itemName = typeof body.item_name === 'string' ? body.item_name.trim() : '';
  const repairType = typeof body.repair_type === 'string' ? body.repair_type.trim() : '';
  const issueDescription = typeof body.issue_description === 'string' ? body.issue_description.trim() : '';
  const slot = new Date(body.slot);

  if (!Number.isInteger(volunteerId) || volunteerId <= 0 || !visitorName || !itemName || !repairType || !body.slot) {
    return res.status(400).json({ error: 'volunteer_id, visitor_name, item_name, repair_type, and slot are required' });
  }
  if (visitorName.length > 120 || itemName.length > 120 || repairType.length > 80 || issueDescription.length > 1000) {
    return res.status(400).json({ error: 'one_or_more_fields_too_long' });
  }
  if (Number.isNaN(slot.getTime()) || slot <= new Date()) {
    return res.status(400).json({ error: 'slot_must_be_a_valid_future_datetime' });
  }
  if (slot.getUTCMinutes() % 60 !== 0 || slot.getUTCSeconds() !== 0 || slot.getUTCMilliseconds() !== 0) {
    return res.status(400).json({ error: 'appointments_start_on_the_hour' });
  }

  try {
    const pool = await getSqlPool();
    const cancelToken = randomBytes(24).toString('hex');
    const cancelTokenHash = createHash('sha256').update(cancelToken).digest('hex');
    const result = await pool.request()
      .input('volunteer_id', sql.Int, volunteerId)
      .input('visitor_name', sql.NVarChar(120), visitorName)
      .input('item_name', sql.NVarChar(120), itemName)
      .input('repair_type', sql.NVarChar(80), repairType)
      .input('issue_description', sql.NVarChar(1000), issueDescription || null)
      .input('cancel_token_hash', sql.Char(64), cancelTokenHash)
      .input('slot', sql.DateTime2, slot)
      .query(`
        INSERT INTO repair_appointments
          (volunteer_id, visitor_name, item_name, repair_type, issue_description, slot, cancel_token_hash)
        OUTPUT INSERTED.id, INSERTED.volunteer_id, INSERTED.visitor_name, INSERTED.item_name,
               INSERTED.repair_type, INSERTED.issue_description, INSERTED.slot
        VALUES (@volunteer_id, @visitor_name, @item_name, @repair_type, @issue_description, @slot, @cancel_token_hash)
      `);
    res.status(201).json({ ...result.recordset[0], cancel_token: cancelToken });
  } catch (err) {
    if (err.number === 2601 || err.number === 2627) {
      return res.status(409).json({ error: 'volunteer_slot_unavailable' });
    }
    if (err.number === 547) {
      return res.status(400).json({ error: 'volunteer_not_found' });
    }
    next(err);
  }
});

app.delete('/appointments/:id', async (req, res, next) => {
  const idText = req.params.id;
  const id = Number(idText);
  if (!/^\d+$/.test(idText) || !Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }
  const cancelToken = typeof req.body?.cancel_token === 'string' ? req.body.cancel_token : '';
  if (!/^[0-9a-f]{48}$/i.test(cancelToken)) {
    return res.status(404).json({ error: 'appointment_not_found' });
  }
  try {
    const pool = await getSqlPool();
    const cancelTokenHash = createHash('sha256').update(cancelToken).digest('hex');
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('cancel_token_hash', sql.Char(64), cancelTokenHash)
      .query('DELETE FROM repair_appointments WHERE id = @id AND cancel_token_hash = @cancel_token_hash');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'appointment_not_found' });
    res.json({ ok: true, deleted: id });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  if (err.code === 'NO_DB_CONFIG' || err.code === 'INVALID_DB_CONFIG') {
    return res.status(503).json({ error: 'database_not_configured' });
  }
  console.error('unhandled', err);
  res.status(500).json({ error: 'internal_error' });
});

if (process.argv[1] && url.fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(PORT, () => console.log(`repair-cafe-api listening on :${PORT}`));
}

export { app };
export default app;
