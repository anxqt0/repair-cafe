import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const CANCEL_TOKENS_KEY = 'repair-cafe.cancel-tokens';
const repairTypes = ['จักรยาน', 'เครื่องใช้ไฟฟ้า', 'เสื้อผ้าและสิ่งทอ', 'อุปกรณ์อิเล็กทรอนิกส์', 'ของใช้ในบ้าน', 'ยังไม่แน่ใจ'];

function readCancelTokens() {
  try { return JSON.parse(localStorage.getItem(CANCEL_TOKENS_KEY) || '{}'); }
  catch { return {}; }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'request_failed');
  return body;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function localDateTimeMin() {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function App() {
  const [volunteers, setVolunteers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cancelTokens, setCancelTokens] = useState(readCancelTokens);
  const [form, setForm] = useState({ volunteer_id: '', visitor_name: '', item_name: '', repair_type: '', issue_description: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(null);

  async function load() {
    try {
      setError('');
      const [nextVolunteers, nextAppointments] = await Promise.all([
        request('/volunteers'), request('/appointments'),
      ]);
      setVolunteers(nextVolunteers);
      setAppointments(nextAppointments);
      setForm(current => ({ ...current, volunteer_id: current.volunteer_id || String(nextVolunteers[0]?.id || '') }));
    } catch (err) {
      setError(err.message === 'database_not_configured' ? 'ยังไม่ได้เชื่อมต่อฐานข้อมูล' : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const slot = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(slot.getTime()) || slot <= new Date()) {
      setError('กรุณาเลือกวันและเวลาที่ยังไม่ผ่านไป');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const created = await request('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slot: slot.toISOString() }),
      });
      setCancelTokens(current => {
        const next = { ...current, [created.id]: created.cancel_token };
        localStorage.setItem(CANCEL_TOKENS_KEY, JSON.stringify(next));
        return next;
      });
      setNotice('จองคิวสำเร็จ ปุ่มยกเลิกนัดจะอยู่ในอุปกรณ์นี้');
      setForm(current => ({ ...current, visitor_name: '', item_name: '', repair_type: '', issue_description: '', date: '', time: '' }));
      await load();
    } catch (err) {
      setError(err.message === 'volunteer_slot_unavailable'
        ? 'ช่างคนนี้มีคิวแล้วในช่วงเวลาดังกล่าว กรุณาเลือกเวลาอื่น'
        : err.message === 'slot_must_be_a_valid_future_datetime'
          ? 'กรุณาเลือกวันและเวลาที่ยังไม่ผ่านไป'
          : 'จองคิวไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id) {
    if (!window.confirm('ยกเลิกคิวซ่อมนี้หรือไม่?')) return;
    setCanceling(id);
    setError('');
    try {
      await request(`/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_token: cancelTokens[id] }),
      });
      setCancelTokens(current => {
        const next = { ...current };
        delete next[id];
        localStorage.setItem(CANCEL_TOKENS_KEY, JSON.stringify(next));
        return next;
      });
      await load();
    } catch {
      setError('ยกเลิกคิวไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setCanceling(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Repair Café หน้าแรก"><span className="brand-mark">✳</span> repair<span>café</span></a>
        <a className="header-link" href="#book">จองคิว <span>↘</span></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> REPAIR CAFÉ · BANGKOK</p>
            <h1>จองคิวช่าง<br /><span>มาซ่อมของ</span></h1>
            <p className="hero-description">เลือกประเภทงาน ช่าง และเวลาที่สะดวก แล้วมาซ่อมของชิ้นโปรดด้วยกัน</p>
            <a className="hero-cta" href="#book">เริ่มจองคิว <span>↓</span></a>
          </div>
          <div className="hero-card" aria-label="ซ่อมก่อนซื้อใหม่ ช่วยลดขยะและยืดอายุของใช้">
            <div className="hero-card-top"><span>FIX IT TOGETHER</span><span>✳</span></div>
            <div className="hero-illustration"><div className="hero-disc" /><span className="tool-symbol">⌁</span><span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✳</span></div>
            <div className="hero-card-bottom"><strong>ซ่อมก่อนซื้อใหม่</strong><span>ให้ของชิ้นโปรดได้ไปต่อ</span></div>
          </div>
          <div className="hero-footnote"><span>01</span><span>เลือกช่าง · เลือกเวลา · จองได้เลย</span></div>
        </section>

        <section className="booking-section" id="book">
          <div className="section-heading">
            <div><p className="eyebrow">BOOK A REPAIR</p><h2>จองคิวซ่อม</h2></div>
            <p>ใช้เวลาประมาณ 1 ชั่วโมง<br />ค่าอะไหล่คุยกันที่หน้างาน</p>
          </div>

          <form className="booking-form" onSubmit={submit}>
            {error && <div className="notice error-notice" role="alert">{error}</div>}
            {notice && <div className="notice success-notice" role="status">{notice}</div>}

            <div className="form-grid">
              <label>ชื่อผู้จอง
                <input value={form.visitor_name} onChange={e => update('visitor_name', e.target.value)} placeholder="ชื่อที่ให้ช่างเรียก" maxLength="120" autoComplete="name" required />
              </label>
              <label>ของที่ต้องการซ่อม
                <input value={form.item_name} onChange={e => update('item_name', e.target.value)} placeholder="เช่น โคมไฟตั้งโต๊ะ" maxLength="120" required />
              </label>
              <label>ประเภทงานซ่อม
                <select value={form.repair_type} onChange={e => update('repair_type', e.target.value)} required>
                  <option value="">เลือกประเภทงาน</option>{repairTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>เลือกช่าง
                <select value={form.volunteer_id} onChange={e => update('volunteer_id', e.target.value)} required>
                  <option value="">เลือกช่าง</option>{volunteers.map(person => <option key={person.id} value={person.id}>{person.name} · {person.specialty}</option>)}
                </select>
              </label>
              {form.volunteer_id && <p className="volunteer-note">✳ {volunteers.find(person => String(person.id) === String(form.volunteer_id))?.bio}</p>}
              <label className="time-field">วันที่ต้องการซ่อม
                <input type="date" value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value, time: '' }))} min={localDateTimeMin().slice(0, 10)} required />
              </label>
              <label>เวลาเริ่มซ่อม
                <select value={form.time} onChange={e => update('time', e.target.value)} disabled={!form.date} aria-describedby="time-help" required>
                  <option value="">{form.date ? 'เลือกเวลา' : 'เลือกวันที่ก่อน'}</option>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const time = `${String(hour).padStart(2, '0')}:00`;
                    const isPast = new Date(`${form.date}T${time}`) <= new Date();
                    return <option key={time} value={time} disabled={isPast}>{time} น.{isPast ? ' · ผ่านไปแล้ว' : ''}</option>;
                  })}
                </select>
                <span className="field-help" id="time-help">เริ่มทุกต้นชั่วโมง ใช้เวลาประมาณ 1 ชั่วโมง</span>
              </label>
              <details className="details-field">
                <summary>เพิ่มรายละเอียดอาการ <span>ไม่บังคับ</span></summary>
                <textarea value={form.issue_description} onChange={e => update('issue_description', e.target.value)} placeholder="เล่าอาการที่พบสั้น ๆ" maxLength="1000" rows="3" />
              </details>
            </div>

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={submitting || loading || !volunteers.length}>{submitting ? 'กำลังจอง…' : 'ยืนยันการจอง'} <span>↗</span></button>
            </div>
          </form>
        </section>

        <section className="appointments-section">
          <div className="section-heading upcoming-heading">
            <div><p className="eyebrow">UP NEXT</p><h2>คิวที่กำลังจะมาถึง</h2></div>
            <span className="appointment-count">{appointments.length.toString().padStart(2, '0')} คิว</span>
          </div>
          {loading ? <div className="empty-state">กำลังโหลดคิว…</div> : appointments.length === 0 ? <div className="empty-state">ยังไม่มีคิวที่จองไว้</div> : (
            <div className="appointment-list">{appointments.map((appointment, index) => (
              <article className="appointment-card" key={appointment.id}>
                <div className="appointment-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="appointment-date">{formatDate(appointment.slot)}</div>
                <div className="appointment-type"><strong>{appointment.repair_type}</strong><span>ช่าง {appointment.volunteer_name} · {appointment.specialty}</span></div>
                {cancelTokens[appointment.id]
                  ? <button className="cancel-button" onClick={() => cancel(appointment.id)} disabled={canceling === appointment.id}>{canceling === appointment.id ? 'กำลังยกเลิก…' : 'ยกเลิกคิว'}</button>
                  : <span className="cancel-hint">ยกเลิกได้จากอุปกรณ์ที่จอง</span>}
              </article>
            ))}</div>
          )}
          {error && <div className="notice error-notice list-notice" role="alert">{error}</div>}
        </section>
      </main>

      <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">✳</span> repair<span>café</span></a><span>© 2024 Repair Café Bangkok</span></footer>
    </div>
  );
}
