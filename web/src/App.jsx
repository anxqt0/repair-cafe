import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const CANCEL_TOKENS_KEY = 'repair-cafe.cancel-tokens';
const LANGUAGE_KEY = 'repair-cafe.language';
const languages = {
  th: {
    pageTitle: 'Repair Café — ซ่อมด้วยกัน', home: 'Repair Café หน้าแรก', switchTo: 'English', bookNav: 'จองคิว',
    heroTitle: 'จองคิวช่าง', heroAccent: 'มาซ่อมของ', heroDescription: 'เลือกงานซ่อม ช่าง และเวลาที่สะดวก เพื่อซ่อมของชิ้นโปรด', startBooking: 'เริ่มจองคิว',
    heroCardLabel: 'ซ่อมก่อนซื้อใหม่ ช่วยลดขยะและยืดอายุของใช้', heroCardTitle: 'ซ่อมก่อนซื้อใหม่', heroCardSubtitle: 'ให้ของชิ้นโปรดได้ไปต่อ', heroFootnote: 'เลือกช่าง · เลือกเวลา · จองได้เลย',
    bookingKicker: 'BOOK A REPAIR', bookingTitle: 'จองคิวซ่อม', durationNote: 'ใช้เวลาประมาณ 1 ชั่วโมง', partsNote: 'ค่าอะไหล่คุยกันที่หน้างาน',
    visitorName: 'ชื่อผู้จอง', visitorPlaceholder: 'ชื่อที่ให้ช่างเรียก', itemName: 'ของที่ต้องการซ่อม', itemPlaceholder: 'เช่น โคมไฟตั้งโต๊ะ', repairType: 'ประเภทงานซ่อม', chooseRepair: 'เลือกประเภทงาน', chooseTechnician: 'เลือกช่าง',
    repairTypes: ['จักรยาน', 'เครื่องใช้ไฟฟ้า', 'เสื้อผ้าและสิ่งทอ', 'อุปกรณ์อิเล็กทรอนิกส์', 'ของใช้ในบ้าน', 'ยังไม่แน่ใจ'],
    specialties: { 'จักรยาน': 'จักรยาน', 'เครื่องใช้ไฟฟ้า': 'เครื่องใช้ไฟฟ้า', 'อุปกรณ์อิเล็กทรอนิกส์': 'อุปกรณ์อิเล็กทรอนิกส์', 'ของใช้ในบ้าน': 'ของใช้ในบ้าน', 'เสื้อผ้าและสิ่งทอ': 'เสื้อผ้าและสิ่งทอ' },
    repairTypeEnglish: { 'จักรยาน': 'Bicycle', 'เครื่องใช้ไฟฟ้า': 'Small appliance', 'เสื้อผ้าและสิ่งทอ': 'Clothing & textiles', 'อุปกรณ์อิเล็กทรอนิกส์': 'Electronics', 'ของใช้ในบ้าน': 'Home item', 'ยังไม่แน่ใจ': 'Not sure yet' },
    date: 'วันที่ต้องการซ่อม', time: 'เวลาเริ่มซ่อม', chooseDateFirst: 'เลือกวันที่ก่อน', chooseTime: 'เลือกเวลา', past: 'ผ่านไปแล้ว', timeHelp: 'เริ่มทุกต้นชั่วโมง ใช้เวลาประมาณ 1 ชั่วโมง',
    details: 'เพิ่มรายละเอียดอาการ', optional: 'ไม่บังคับ', detailsPlaceholder: 'เล่าอาการที่พบสั้น ๆ', submit: 'ยืนยันการจอง', submitting: 'กำลังจอง…', success: 'จองคิวสำเร็จ ปุ่มยกเลิกนัดจะอยู่ในอุปกรณ์นี้',
    pastError: 'กรุณาเลือกวันและเวลาที่ยังไม่ผ่านไป', unavailable: 'ช่างคนนี้มีคิวแล้วในช่วงเวลาดังกล่าว กรุณาเลือกเวลาอื่น', bookingError: 'จองคิวไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่',
    loadError: 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่', databaseError: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล', cancelConfirm: 'ยกเลิกคิวซ่อมนี้หรือไม่?', cancelError: 'ยกเลิกคิวไม่สำเร็จ กรุณาลองอีกครั้ง', canceling: 'กำลังยกเลิก…', cancel: 'ยกเลิกคิว', cancelHint: 'ยกเลิกได้จากอุปกรณ์ที่จอง',
    upcomingKicker: 'UP NEXT', upcomingTitle: 'คิวที่กำลังจะมาถึง', appointments: 'คิว', loading: 'กำลังโหลดคิว…', empty: 'ยังไม่มีคิวที่จองไว้', technician: 'ช่าง', notConfigured: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล',
  },
  en: {
    pageTitle: 'Repair Café Bangkok — Book a repair', home: 'Repair Café home', switchTo: 'ไทย', bookNav: 'Book now',
    heroTitle: 'Book a repair', heroAccent: 'with a local fixer', heroDescription: 'Choose a repair, a technician, and a time that works for you.', startBooking: 'Book a repair',
    heroCardLabel: 'Repair more. Waste less.', heroCardTitle: 'Fix it, don’t replace it', heroCardSubtitle: 'Give your favorite things a new life', heroFootnote: 'Choose a technician · Pick a time · You’re booked',
    bookingKicker: 'BOOK A REPAIR', bookingTitle: 'Make a booking', durationNote: 'About 1 hour per repair', partsNote: 'Parts are discussed in person',
    visitorName: 'Your name', visitorPlaceholder: 'What should the technician call you?', itemName: 'Item to repair', itemPlaceholder: 'e.g. a desk lamp', repairType: 'Type of repair', chooseRepair: 'Choose a repair type', chooseTechnician: 'Choose a technician',
    repairTypes: ['Bicycle', 'Small appliance', 'Clothing & textiles', 'Electronics', 'Home item', 'Not sure yet'],
    specialties: { 'จักรยาน': 'Bicycles', 'เครื่องใช้ไฟฟ้า': 'Small appliances', 'อุปกรณ์อิเล็กทรอนิกส์': 'Electronics', 'ของใช้ในบ้าน': 'Home items, furniture & toys', 'เสื้อผ้าและสิ่งทอ': 'Clothing & textiles' },
    repairTypeEnglish: { 'จักรยาน': 'Bicycle', 'เครื่องใช้ไฟฟ้า': 'Small appliance', 'เสื้อผ้าและสิ่งทอ': 'Clothing & textiles', 'อุปกรณ์อิเล็กทรอนิกส์': 'Electronics', 'ของใช้ในบ้าน': 'Home item', 'ยังไม่แน่ใจ': 'Not sure yet' },
    date: 'Preferred date', time: 'Start time', chooseDateFirst: 'Choose a date first', chooseTime: 'Choose a time', past: 'Past', timeHelp: 'Sessions start on the hour and last about 1 hour',
    details: 'Tell us what’s wrong', optional: 'optional', detailsPlaceholder: 'Briefly describe the issue', submit: 'Confirm booking', submitting: 'Booking…', success: 'Booking confirmed. You can cancel it from this device.',
    pastError: 'Please choose a future date and time.', unavailable: 'This technician is already booked then. Please choose another time.', bookingError: 'Could not complete the booking. Check your details and try again.',
    loadError: 'Could not load the information. Please try again.', databaseError: 'The database is not connected yet.', cancelConfirm: 'Cancel this repair booking?', cancelError: 'Could not cancel the booking. Please try again.', canceling: 'Cancelling…', cancel: 'Cancel booking', cancelHint: 'Cancel from the device used to book',
    upcomingKicker: 'UP NEXT', upcomingTitle: 'Upcoming bookings', appointments: 'bookings', loading: 'Loading bookings…', empty: 'No upcoming bookings yet', technician: 'Technician', notConfigured: 'The database is not connected yet.',
  },
};

function readCancelTokens() {
  try { return JSON.parse(localStorage.getItem(CANCEL_TOKENS_KEY) || '{}'); }
  catch { return {}; }
}

function getSavedLanguage() {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'th'; }
  catch { return 'th'; }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'request_failed');
  return body;
}

function formatDate(value, language) {
  const locale = language === 'th' ? 'th-TH' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function localDateTimeMin() {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function App() {
  const [language, setLanguage] = useState(getSavedLanguage);
  const t = languages[language];
  const [volunteers, setVolunteers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cancelTokens, setCancelTokens] = useState(readCancelTokens);
  const [form, setForm] = useState({ volunteer_id: '', visitor_name: '', item_name: '', repair_type: '', issue_description: '', date: '', time: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', language === 'th' ? 'จองคิวซ่อมของกับช่าง Repair Café Bangkok' : 'Book a repair with a local technician at Repair Café Bangkok.');
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Language still works for this session. */ }
  }, [language, t.pageTitle]);

  async function load() {
    try {
      setError('');
      const [nextVolunteers, nextAppointments] = await Promise.all([request('/volunteers'), request('/appointments')]);
      setVolunteers(nextVolunteers);
      setAppointments(nextAppointments);
      setForm(current => ({ ...current, volunteer_id: current.volunteer_id || String(nextVolunteers[0]?.id || '') }));
    } catch (err) {
      setError(err.message === 'database_not_configured' ? 'notConfigured' : 'loadError');
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
      setError('pastError');
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
      setNotice('success');
      setForm(current => ({ ...current, visitor_name: '', item_name: '', repair_type: '', issue_description: '', date: '', time: '' }));
      await load();
    } catch (err) {
      setError(err.message === 'volunteer_slot_unavailable' ? 'unavailable' : err.message === 'slot_must_be_a_valid_future_datetime' ? 'pastError' : 'bookingError');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id) {
    if (!window.confirm(t.cancelConfirm)) return;
    setCanceling(id);
    setError('');
    try {
      await request(`/appointments/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
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
      setError('cancelError');
    } finally {
      setCanceling(null);
    }
  }

  function translatedError(key) {
    return key === 'notConfigured' ? t.notConfigured : t[key] || '';
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.home}><span className="brand-mark">✳</span> repair<span>café</span></a>
        <nav className="header-actions" aria-label={language === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
          <button className="language-toggle" type="button" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} aria-label={language === 'th' ? 'Switch language to English' : 'เปลี่ยนภาษาเป็นไทย'}>{t.switchTo}</button>
          <a className="header-link" href="#book">{t.bookNav} <span>↘</span></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> REPAIR CAFÉ · BANGKOK</p>
            <h1>{t.heroTitle}<br /><span>{t.heroAccent}</span></h1>
            <p className="hero-description">{t.heroDescription}</p>
            <a className="hero-cta" href="#book">{t.startBooking} <span>↓</span></a>
          </div>
          <div className="hero-card" aria-label={t.heroCardLabel}>
            <div className="hero-card-top"><span>FIX IT TOGETHER</span><span>✳</span></div>
            <div className="hero-illustration"><div className="hero-disc" /><span className="tool-symbol">⌁</span><span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✳</span></div>
            <div className="hero-card-bottom"><strong>{t.heroCardTitle}</strong><span>{t.heroCardSubtitle}</span></div>
          </div>
          <div className="hero-footnote"><span>01</span><span>{t.heroFootnote}</span></div>
        </section>

        <section className="booking-section" id="book">
          <div className="section-heading">
            <div><p className="eyebrow">{t.bookingKicker}</p><h2>{t.bookingTitle}</h2></div>
            <p>{t.durationNote}<br />{t.partsNote}</p>
          </div>

          <form className="booking-form" onSubmit={submit}>
            {error && <div className="notice error-notice" role="alert">{translatedError(error)}</div>}
            {notice && <div className="notice success-notice" role="status">{t[notice]}</div>}

            <div className="form-grid">
              <label>{t.visitorName}
                <input value={form.visitor_name} onChange={e => update('visitor_name', e.target.value)} placeholder={t.visitorPlaceholder} maxLength="120" autoComplete="name" required />
              </label>
              <label>{t.itemName}
                <input value={form.item_name} onChange={e => update('item_name', e.target.value)} placeholder={t.itemPlaceholder} maxLength="120" required />
              </label>
              <label>{t.repairType}
                <select value={form.repair_type} onChange={e => update('repair_type', e.target.value)} required>
                  <option value="">{t.chooseRepair}</option>{t.repairTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>{t.chooseTechnician}
                <select value={form.volunteer_id} onChange={e => update('volunteer_id', e.target.value)} required>
                  <option value="">{t.chooseTechnician}</option>{volunteers.map(person => <option key={person.id} value={person.id}>{person.name} · {t.specialties[person.specialty] || person.specialty}</option>)}
                </select>
              </label>
              {form.volunteer_id && <p className="volunteer-note">✳ {t.specialties[volunteers.find(person => String(person.id) === String(form.volunteer_id))?.specialty] || volunteers.find(person => String(person.id) === String(form.volunteer_id))?.bio}</p>}
              <label className="time-field">{t.date}
                <input type="date" value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value, time: '' }))} min={localDateTimeMin().slice(0, 10)} required />
              </label>
              <label>{t.time}
                <select value={form.time} onChange={e => update('time', e.target.value)} disabled={!form.date} aria-describedby="time-help" required>
                  <option value="">{form.date ? t.chooseTime : t.chooseDateFirst}</option>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const time = `${String(hour).padStart(2, '0')}:00`;
                    const isPast = new Date(`${form.date}T${time}`) <= new Date();
                    return <option key={time} value={time} disabled={isPast}>{time}{language === 'th' ? ' น.' : ''}{isPast ? ` · ${t.past}` : ''}</option>;
                  })}
                </select>
                <span className="field-help" id="time-help">{t.timeHelp}</span>
              </label>
              <details className="details-field">
                <summary>{t.details} <span>{t.optional}</span></summary>
                <textarea value={form.issue_description} onChange={e => update('issue_description', e.target.value)} placeholder={t.detailsPlaceholder} maxLength="1000" rows="3" />
              </details>
            </div>

            <div className="form-actions">
              <button className="submit-button" type="submit" disabled={submitting || loading || !volunteers.length}>{submitting ? t.submitting : t.submit} <span>↗</span></button>
            </div>
          </form>
        </section>

        <section className="appointments-section">
          <div className="section-heading upcoming-heading">
            <div><p className="eyebrow">{t.upcomingKicker}</p><h2>{t.upcomingTitle}</h2></div>
            <span className="appointment-count">{appointments.length.toString().padStart(2, '0')} {t.appointments}</span>
          </div>
          {loading ? <div className="empty-state">{t.loading}</div> : appointments.length === 0 ? <div className="empty-state">{t.empty}</div> : (
            <div className="appointment-list">{appointments.map((appointment, index) => (
              <article className="appointment-card" key={appointment.id}>
                <div className="appointment-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="appointment-date">{formatDate(appointment.slot, language)}</div>
                <div className="appointment-type"><strong>{language === 'th' ? appointment.repair_type : t.repairTypeEnglish[appointment.repair_type] || appointment.repair_type}</strong><span>{t.technician} {appointment.volunteer_name} · {t.specialties[appointment.specialty] || appointment.specialty}</span></div>
                {cancelTokens[appointment.id]
                  ? <button className="cancel-button" onClick={() => cancel(appointment.id)} disabled={canceling === appointment.id}>{canceling === appointment.id ? t.canceling : t.cancel}</button>
                  : <span className="cancel-hint">{t.cancelHint}</span>}
              </article>
            ))}</div>
          )}
          {error && <div className="notice error-notice list-notice" role="alert">{translatedError(error)}</div>}
        </section>
      </main>

      <footer className="site-footer"><span>Repair Café Bangkok</span></footer>
    </div>
  );
}
