import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import {
  LayoutDashboard, CalendarCheck, Users, CalendarDays, Megaphone, Map as MapIcon,
  User, Search, Bell, Moon, Sun, ChevronRight, Clock, TrendingUp, CheckCircle2,
  XCircle, AlertCircle, Stethoscope, Plus, Filter, Download, X, Navigation,
  Building2, BookOpen, GraduationCap, Menu, Star, Accessibility, Droplet,
  ParkingCircle, UtensilsCrossed, Landmark, Trees, ShieldCheck, Pencil, Trash2,
  LogOut, Wifi, WifiOff, Eye, EyeOff,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import CampusNavigation from './components/CampusNavigation';


/* ------------------------------------------------------------------ */
/* API client — talks to the Express + Prisma backend when it's        */
/* reachable. This chat preview has no network path to a locally-      */
/* running API, so the app always falls back to the mock data below    */
/* here; point API_BASE at your own deployment to go live.             */
/* ------------------------------------------------------------------ */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const STATUS_FROM_API = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', MEDICAL_LEAVE: 'Medical Leave' };
const STATUS_TO_API = { Present: 'PRESENT', Absent: 'ABSENT', Late: 'LATE', 'Medical Leave': 'MEDICAL_LEAVE' };
const DAY_NUM_TO_LABEL = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const SUBJECT_COLORS = { CS301: '#0A84FF', CS302: '#12B981', CS303: '#F5A623', CS304: '#8B5CF6', CS305: '#F76C6C', MA401: '#22C1C3' };

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function formatRelativeTime(iso) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.message || `Request failed (${res.status})`);
  return json.data;
}

// Fetches every page of a paginated endpoint (only /attendance is paginated
// server-side) so dashboard totals and trend charts see the full history.
async function fetchAllPages(path, token) {
  let page = 1;
  let all = [];
  for (;;) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${API_BASE}${path}${sep}page=${page}&pageSize=100`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || 'Request failed');
    all = all.concat(json.data);
    if (!json.meta || all.length >= json.meta.total || json.data.length === 0) break;
    page += 1;
  }
  return all;
}

/* ---- normalizers: reshape API responses to match the mock data below,
   so every existing component keeps working unchanged in either mode ---- */
function normalizeStudent(s) {
  return {
    id: s.id,
    name: s.user?.name || s.name || 'Unknown',
    usn: s.usn,
    section: s.section?.name || '',
    sem: s.semester,
    branch: s.department?.code || 'CSE',
    email: s.user?.email,
    phone: s.user?.phone,
  };
}
function normalizeSubject(s) {
  return { id: s.id, name: s.name, code: s.code, faculty: s.teacher?.user?.name || 'Staff', color: SUBJECT_COLORS[s.code] || '#0A84FF' };
}
function normalizeAttendance(a) {
  return { id: a.id, studentId: a.studentId, subjectId: a.subjectId, date: formatShortDate(a.date), period: a.period, status: STATUS_FROM_API[a.status] || a.status };
}
function normalizeAnnouncement(a) {
  return { id: a.id, title: a.title, author: a.author?.name || 'Staff', date: formatShortDate(a.createdAt), hasAttachment: !!a.attachmentUrl, tag: a.tag || 'Notice' };
}
function normalizeNotification(n) {
  return { id: n.id, type: n.type, text: n.message, time: formatRelativeTime(n.createdAt) };
}
function normalizeTimetable(entries) {
  const table = { Mon: Array(6).fill(null), Tue: Array(6).fill(null), Wed: Array(6).fill(null), Thu: Array(6).fill(null), Fri: Array(6).fill(null), Sat: Array(6).fill(null) };
  entries.forEach((e) => {
    const label = DAY_NUM_TO_LABEL[e.dayOfWeek];
    if (label && e.period >= 1 && e.period <= 6) table[label][e.period - 1] = e.subjectId;
  });
  return table;
}

const api = {
  health: () => fetch(`${API_BASE.replace(/\/api$/, '')}/health`).then((r) => r.ok),
  login: (email, password, role) => apiRequest('/auth/login', { method: 'POST', body: { email, password, expectedRole: role } }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),

  students: (token) => apiRequest('/students', { token }).then((rows) => rows.map(normalizeStudent)),
  subjects: (token) => apiRequest('/subjects', { token }).then((rows) => rows.map(normalizeSubject)),
  attendance: (token) => fetchAllPages('/attendance', token).then((rows) => rows.map(normalizeAttendance)),
  timetable: (token, sectionId) => apiRequest(`/timetable${sectionId ? `?sectionId=${sectionId}` : ''}`, { token }).then(normalizeTimetable),
  announcements: (token) => apiRequest('/announcements', { token }).then((rows) => rows.map(normalizeAnnouncement)),
  notifications: (token) => apiRequest('/notifications', { token }).then((rows) => rows.map(normalizeNotification)),

  markAttendance: (token, { subjectId, date, period, entries }) =>
    apiRequest('/attendance', { token, method: 'POST', body: { subjectId, date, period, entries: entries.map((e) => ({ studentId: e.studentId, status: STATUS_TO_API[e.status] })) } }),
  updateAttendance: (token, id, status) => apiRequest(`/attendance/${id}`, { token, method: 'PATCH', body: { status: STATUS_TO_API[status] } }),
  deleteAttendance: (token, id) => apiRequest(`/attendance/${id}`, { token, method: 'DELETE' }),
  postAnnouncement: (token, { title, body, tag }) => apiRequest('/announcements', { token, method: 'POST', body: { title, body, tag } }),
  updateProfile: (token, { phone }) => apiRequest('/students/me', { token, method: 'PATCH', body: { phone } }),
  campusRoute: (token, from, to, accessible) => apiRequest(`/campus/route?from=${from}&to=${to}&accessible=${accessible}`, { token }),
};

// Loads every dataset the app needs in one pass, right after login.
async function fetchAllLiveData(token) {
  const [students, subjects, attendance, timetable, announcements, notifications] = await Promise.all([
    api.students(token), api.subjects(token), api.attendance(token),
    api.timetable(token), api.announcements(token), api.notifications(token),
  ]);
  return { students, subjects, attendance, timetable, announcements, notifications };
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const PALETTE = {
  appleBlue: '#0A84FF',
  emerald: '#12B981',
  amber: '#F5A623',
  softRed: '#F76C6C',
};

const THEME = {
  light: {
    pageBg: '#F8FAFC',
    blobA: 'rgba(10,132,255,0.16)',
    blobC: 'rgba(16,185,129,0.10)',
    panel: 'rgba(255,255,255,0.55)',
    panelBorder: 'rgba(255,255,255,0.9)',
    panelSoft: 'rgba(255,255,255,0.4)',
    text: '#1C1C1E',
    subtext: '#6E7480',
    faint: '#9AA1AC',
    sidebar: 'rgba(255,255,255,0.5)',
    input: 'rgba(255,255,255,0.7)',
    shadow: '0 10px 40px rgba(30,41,59,0.10)',
    divider: 'rgba(28,28,30,0.08)',
  },
  dark: {
    pageBg: '#0B0B0D',
    blobA: 'rgba(10,132,255,0.22)',
    blobC: 'rgba(16,185,129,0.14)',
    panel: 'rgba(28,28,30,0.55)',
    panelBorder: 'rgba(255,255,255,0.08)',
    panelSoft: 'rgba(255,255,255,0.05)',
    text: '#F5F5F7',
    subtext: '#A1A1A6',
    faint: '#6E6E73',
    sidebar: 'rgba(20,20,22,0.55)',
    input: 'rgba(255,255,255,0.07)',
    shadow: '0 10px 40px rgba(0,0,0,0.5)',
    divider: 'rgba(255,255,255,0.08)',
  },
};

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

/* ------------------------------------------------------------------ */
/* Mock data — stands in for the Postgres/Prisma layer                 */
/* ------------------------------------------------------------------ */
const SUBJECTS = [
  { id: 'ds', name: 'Data Structures', code: 'CS301', faculty: 'Dr. Anitha Rao', color: '#0A84FF' },
  { id: 'os', name: 'Operating Systems', code: 'CS302', faculty: 'Prof. Kiran Kumar', color: '#12B981' },
  { id: 'dbms', name: 'Database Management Systems', code: 'CS303', faculty: 'Dr. Anitha Rao', color: '#F5A623' },
  { id: 'cn', name: 'Computer Networks', code: 'CS304', faculty: 'Prof. Suresh Babu', color: '#8B5CF6' },
  { id: 'toc', name: 'Theory of Computation', code: 'CS305', faculty: 'Dr. Meera Nair', color: '#F76C6C' },
  { id: 'em4', name: 'Engineering Mathematics IV', code: 'MA401', faculty: 'Prof. Ramesh Iyer', color: '#22C1C3' },
];

const STUDENTS = [
  { id: 1, name: 'Aditya Sharma', usn: '1VE22CS004', section: 'A', sem: 5, branch: 'CSE' },
  { id: 2, name: 'Priya Reddy', usn: '1VE22CS011', section: 'A', sem: 5, branch: 'CSE' },
  { id: 3, name: 'Rohan Gowda', usn: '1VE22CS019', section: 'A', sem: 5, branch: 'CSE' },
  { id: 4, name: 'Sneha Patil', usn: '1VE22CS023', section: 'B', sem: 5, branch: 'CSE' },
  { id: 5, name: 'Karthik Rajan', usn: '1VE22CS028', section: 'B', sem: 5, branch: 'CSE' },
  { id: 6, name: 'Divya Shetty', usn: '1VE22CS031', section: 'B', sem: 5, branch: 'CSE' },
  { id: 7, name: 'Arjun Nair', usn: '1VE22CS037', section: 'A', sem: 5, branch: 'CSE' },
  { id: 8, name: 'Ishita Verma', usn: '1VE22CS042', section: 'A', sem: 5, branch: 'CSE' },
  { id: 9, name: 'Mohammed Faizan', usn: '1VE22CS045', section: 'B', sem: 5, branch: 'CSE' },
  { id: 10, name: 'Ananya Joshi', usn: '1VE22CS050', section: 'B', sem: 5, branch: 'CSE' },
];
const CURRENT_STUDENT = STUDENTS[0];

const DATES = ['Jul 14', 'Jul 15', 'Jul 16', 'Jul 17', 'Jul 18', 'Jul 21', 'Jul 22', 'Jul 23', 'Jul 24', 'Jul 25'];
// Same 10 calendar dates the backend seed script uses — lets the frontend
// send a real ISO date to the API while still showing the short label.
const DATE_TO_ISO = {
  'Jul 14': '2026-07-14', 'Jul 15': '2026-07-15', 'Jul 16': '2026-07-16', 'Jul 17': '2026-07-17', 'Jul 18': '2026-07-18',
  'Jul 21': '2026-07-21', 'Jul 22': '2026-07-22', 'Jul 23': '2026-07-23', 'Jul 24': '2026-07-24', 'Jul 25': '2026-07-25',
};

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function pickStatus(seed) {
  const r = seededRandom(seed);
  if (r < 0.82) return 'Present';
  if (r < 0.91) return 'Absent';
  if (r < 0.97) return 'Late';
  return 'Medical Leave';
}
function generateAttendance() {
  const records = [];
  let id = 1;
  STUDENTS.forEach((student) => {
    SUBJECTS.forEach((subject, sj) => {
      DATES.forEach((date, di) => {
        const status = pickStatus(student.id * 13 + sj * 7 + di * 3 + 1);
        records.push({ id: id++, studentId: student.id, subjectId: subject.id, date, period: (di % 6) + 1, status });
      });
    });
  });
  return records;
}
const ATTENDANCE_RECORDS = generateAttendance();

function attendancePercent(records, studentId, subjectId) {
  const recs = records.filter((r) => r.studentId === studentId && (!subjectId || r.subjectId === subjectId));
  if (!recs.length) return 0;
  const present = recs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  return Math.round((present / recs.length) * 100);
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = ['9:00', '10:00', '11:10', '12:10', '1:50', '2:50'];
const TIMETABLE = {
  Mon: ['ds', 'os', 'dbms', null, 'cn', 'toc'],
  Tue: ['os', 'ds', 'em4', null, 'toc', 'cn'],
  Wed: ['dbms', 'cn', 'ds', null, 'os', null],
  Thu: ['cn', 'toc', 'os', null, 'em4', 'ds'],
  Fri: ['em4', 'dbms', 'toc', null, 'ds', 'os'],
  Sat: ['toc', 'os', null, null, null, null],
};

const ANNOUNCEMENTS = [
  { id: 1, title: 'Mid-semester exam timetable released', author: 'Examination Cell', date: 'Jul 26', hasAttachment: true, tag: 'Exams' },
  { id: 2, title: 'Guest lecture on Distributed Systems — Fri 2 PM, Auditorium', author: 'Dr. Anitha Rao', date: 'Jul 25', hasAttachment: false, tag: 'Event' },
  { id: 3, title: 'Library extended hours during exam week', author: 'Library Desk', date: 'Jul 24', hasAttachment: false, tag: 'Notice' },
  { id: 4, title: 'CS303 DBMS assignment 3 uploaded', author: 'Dr. Anitha Rao', date: 'Jul 22', hasAttachment: true, tag: 'Coursework' },
];

const NOTIFICATIONS = [
  { id: 1, type: 'warning', text: 'Your attendance in Computer Networks has dropped below 75%', time: '2h ago' },
  { id: 2, type: 'info', text: 'New announcement from Examination Cell', time: '5h ago' },
  { id: 3, type: 'update', text: 'Thursday timetable updated — Period 5 moved to Room 214', time: '1d ago' },
  { id: 4, type: 'success', text: 'Attendance marked for Data Structures, Jul 25', time: '2d ago' },
];

/* ------------------------------------------------------------------ */
/* Campus navigation graph — nodes, edges, Dijkstra shortest path      */
/* ------------------------------------------------------------------ */
const NAV_NODES = [
  { id: 'gate', label: 'Main Gate', x: 50, y: 500 },
  { id: 'j00', label: 'North-West Plaza', x: 180, y: 150 },
  { id: 'j10', label: 'North Plaza', x: 480, y: 150 },
  { id: 'j20', label: 'North-East Plaza', x: 780, y: 150 },
  { id: 'j01', label: 'West Plaza', x: 180, y: 320 },
  { id: 'j11', label: 'Central Plaza', x: 480, y: 320 },
  { id: 'j21', label: 'East Plaza', x: 780, y: 320 },
  { id: 'j02', label: 'South-West Plaza', x: 180, y: 500 },
  { id: 'j12', label: 'South Plaza', x: 480, y: 500 },
  { id: 'j22', label: 'South-East Plaza', x: 780, y: 500 },
];

const NAV_BUILDINGS = [
  { id: 'admin', label: 'Administrative Office', x: 100, y: 70, attach: 'j00', category: 'admin', blurb: 'Fees, registrar and general administration.', hours: '9:30 AM – 5:00 PM' },
  { id: 'principal', label: 'Principal Office', x: 260, y: 70, attach: 'j00', category: 'admin', blurb: 'Office of the Principal.', hours: '10:00 AM – 4:00 PM' },
  { id: 'examcell', label: 'Examination Cell', x: 480, y: 60, attach: 'j10', category: 'exam', blurb: 'Exam registration, hall tickets and results.', hours: '9:30 AM – 5:00 PM' },
  { id: 'auditorium', label: 'Auditorium', x: 800, y: 65, attach: 'j20', category: 'auditorium', blurb: 'Seminars, guest lectures and events.', hours: 'Event hours' },
  { id: 'library', label: 'Library', x: 90, y: 320, attach: 'j01', category: 'library', blurb: 'Reading halls, stacks and digital resources.', hours: '8:00 AM – 8:00 PM' },
  { id: 'cse', label: 'CSE & ISE Block', x: 480, y: 230, attach: 'j11', category: 'academic', blurb: 'Labs 101–110, classrooms and faculty rooms.', hours: '8:30 AM – 5:30 PM' },
  { id: 'ece', label: 'ECE & EEE Block', x: 780, y: 230, attach: 'j21', category: 'academic', blurb: 'Labs, classrooms and faculty rooms.', hours: '8:30 AM – 5:30 PM' },
  { id: 'mech', label: 'Mechanical & Civil Block', x: 840, y: 400, attach: 'j22', category: 'academic', blurb: 'Workshops, drawing halls and labs.', hours: '8:30 AM – 5:30 PM' },
  { id: 'cafeteria', label: 'Cafeteria', x: 480, y: 570, attach: 'j12', category: 'dining', blurb: 'Meals, snacks and a quiet study corner.', hours: '8:00 AM – 6:30 PM' },
  { id: 'playground', label: 'Playground', x: 800, y: 560, attach: 'j22', category: 'sports', blurb: 'Open grounds for sports and events.', hours: 'Dawn – dusk' },
  { id: 'parking', label: 'Parking', x: 100, y: 570, attach: 'j02', category: 'parking', blurb: 'Two-wheeler and four-wheeler parking.', hours: '24 hours' },
];

const NAV_AMENITIES = [
  { id: 'wash1', label: 'Washroom', x: 300, y: 290, attach: 'j01', category: 'amenity' },
  { id: 'water1', label: 'Water Point', x: 650, y: 290, attach: 'j21', category: 'amenity' },
  { id: 'wash2', label: 'Washroom', x: 560, y: 480, attach: 'j12', category: 'amenity' },
];

function euclid(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

const ALL_NAV_POINTS = [...NAV_NODES, ...NAV_BUILDINGS, ...NAV_AMENITIES];
const NAV_POINT_MAP = Object.fromEntries(ALL_NAV_POINTS.map((n) => [n.id, n]));

const EDGE_DEFS = [
  ['j00', 'j10'], ['j10', 'j20'],
  ['j01', 'j11'], ['j11', 'j21'],
  ['j02', 'j12'], ['j12', 'j22'],
  ['j00', 'j01'], ['j01', 'j02'],
  ['j10', 'j11', true],
  ['j11', 'j12'],
  ['j20', 'j21'], ['j21', 'j22'],
  ['gate', 'j02'],
];
NAV_BUILDINGS.forEach((b) => EDGE_DEFS.push([b.id, b.attach]));
NAV_AMENITIES.forEach((a) => EDGE_DEFS.push([a.id, a.attach]));

const NAV_EDGES = EDGE_DEFS.map(([a, b, stairs]) => ({
  from: a, to: b, stairs: !!stairs, w: euclid(NAV_POINT_MAP[a], NAV_POINT_MAP[b]),
}));

function shortestPath(startId, endId, avoidStairs) {
  const nodes = ALL_NAV_POINTS;
  const edges = avoidStairs ? NAV_EDGES.filter((e) => !e.stairs) : NAV_EDGES;
  const adj = {};
  edges.forEach((e) => {
    (adj[e.from] = adj[e.from] || []).push({ to: e.to, w: e.w });
    (adj[e.to] = adj[e.to] || []).push({ to: e.from, w: e.w });
  });
  const distMap = {}; const prev = {}; const visited = new Set();
  nodes.forEach((n) => { distMap[n.id] = Infinity; });
  distMap[startId] = 0;
  while (visited.size < nodes.length) {
    let u = null; let best = Infinity;
    nodes.forEach((n) => {
      if (!visited.has(n.id) && distMap[n.id] < best) { best = distMap[n.id]; u = n.id; }
    });
    if (u === null) break;
    visited.add(u);
    if (u === endId) break;
    (adj[u] || []).forEach(({ to, w }) => {
      if (distMap[u] + w < distMap[to]) { distMap[to] = distMap[u] + w; prev[to] = u; }
    });
  }
  const path = [];
  let cur = endId; let guard = 0;
  while (cur !== undefined && guard < nodes.length + 2) { path.unshift(cur); cur = prev[cur]; guard++; }
  if (path[0] !== startId) {
    return { path: [startId, endId], distance: euclid(NAV_POINT_MAP[startId], NAV_POINT_MAP[endId]) };
  }
  return { path, distance: distMap[endId] };
}

function buildStepsFromPoints(pts) {
  if (pts.length < 2) return [];
  const steps = [`Head out from ${pts[0].label}`];
  for (let i = 1; i < pts.length; i++) {
    if (i === pts.length - 1) { steps.push(`Arrive at ${pts[i].label}`); break; }
    const prevP = pts[i - 1]; const curr = pts[i]; const next = pts[i + 1];
    const a1 = Math.atan2(curr.y - prevP.y, curr.x - prevP.x);
    const a2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    let diff = ((a2 - a1) * 180) / Math.PI;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    if (Math.abs(diff) < 20) steps.push(`Continue straight through ${curr.label}`);
    else steps.push(`Turn ${diff > 0 ? 'right' : 'left'} at ${curr.label}`);
  }
  return steps;
}
function buildSteps(path) { return buildStepsFromPoints(path.map((id) => NAV_POINT_MAP[id])); }
function walkTime(distance) { return `${Math.max(1, Math.round(distance / 140))} min`; }

const CATEGORY_STYLE = {
  admin: { grad: ['#8E8E93', '#636366'], icon: Landmark },
  exam: { grad: ['#8B5CF6', '#6D28D9'], icon: ShieldCheck },
  auditorium: { grad: ['#22C1C3', '#0E7490'], icon: Building2 },
  library: { grad: ['#0A84FF', '#0058C7'], icon: BookOpen },
  academic: { grad: ['#0A84FF', '#38BDF8'], icon: GraduationCap },
  dining: { grad: ['#F5A623', '#D97706'], icon: UtensilsCrossed },
  sports: { grad: ['#12B981', '#059669'], icon: Trees },
  parking: { grad: ['#9CA3AF', '#6B7280'], icon: ParkingCircle },
  amenity: { grad: ['#60A5FA', '#3B82F6'], icon: Droplet },
};

const STATUS_STYLE = {
  Present: { bg: 'rgba(18,185,129,0.15)', fg: '#0F9D6E', icon: CheckCircle2 },
  Absent: { bg: 'rgba(247,108,108,0.15)', fg: '#E0393E', icon: XCircle },
  Late: { bg: 'rgba(245,166,35,0.18)', fg: '#B9770E', icon: Clock },
  'Medical Leave': { bg: 'rgba(10,132,255,0.15)', fg: '#0A6FD1', icon: Stethoscope },
};

/* ------------------------------------------------------------------ */
/* UI primitives                                                       */
/* ------------------------------------------------------------------ */
function Glass({ as: As = 'div', className = '', style = {}, children, ...rest }) {
  const { c } = useApp();
  return (
    <As
      className={`rounded-3xl border ${className}`}
      style={{
        background: c.panel,
        borderColor: c.panelBorder,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: c.shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Present;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>
      <Icon size={13} /> {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint }) {
  const { c } = useApp();
  return (
    <Glass className="p-3.5 sm:p-5 flex items-start justify-between hover:-translate-y-0.5 transition-transform duration-300 min-w-0">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide truncate" style={{ color: c.subtext }}>{label}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-1.5 truncate" style={{ color: c.text }}>{value}</p>
        {sub && <p className="text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate" style={{ color: c.faint }}>{sub}</p>}
      </div>
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint || 'rgba(10,132,255,0.12)' }}>
        <Icon size={16} className="sm:w-5 sm:h-5" style={{ color: PALETTE.appleBlue }} />
      </div>
    </Glass>
  );
}

function ThemeToggle() {
  const { dark, setDark } = useApp();
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="relative w-16 h-9 rounded-full transition-colors duration-300 flex items-center px-1"
      style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(10,132,255,0.12)' }}
      aria-label="Toggle dark mode"
    >
      <span
        className="absolute w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
        style={{ background: '#fff', left: dark ? 'calc(100% - 30px)' : '4px' }}
      >
        {dark ? <Moon size={14} color="#0A84FF" /> : <Sun size={14} color="#F5A623" />}
      </span>
    </button>
  );
}

function RoleSwitch() {
  const { role, setRole, c } = useApp();
  return (
    <div className="flex rounded-full p-1 gap-1" style={{ background: c.panelSoft, border: `1px solid ${c.panelBorder}` }}>
      {['student', 'teacher'].map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-300"
          style={{ background: role === r ? PALETTE.appleBlue : 'transparent', color: role === r ? '#fff' : c.subtext }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <Glass className="w-full max-w-lg overflow-auto p-6" style={{ maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'inherit' }}>{title}</h3>
          <CloseBtn onClose={onClose} />
        </div>
        {children}
      </Glass>
    </div>
  );
}
function CloseBtn({ onClose }) {
  const { c } = useApp();
  return (
    <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: c.panelSoft }}>
      <X size={16} style={{ color: c.text }} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Shell — sidebar, topbar                                             */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'campus', label: 'Campus Map', icon: MapIcon },
  { id: 'profile', label: 'Profile', icon: User },
];

function Sidebar({ mobileOpen, onClose }) {
  const { c, tab, setTab, role, setShowLogin } = useApp();
  const isVisitor = role === 'visitor';
  const navItems = isVisitor
    ? NAV_ITEMS.filter((item) => item.id === 'campus' || item.id === 'announcements')
    : NAV_ITEMS;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-0 w-72 shrink-0 flex flex-col p-5 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: c.sidebar, borderRight: `1px solid ${c.divider}`, backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
      >
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: c.text }}>Smart Campus</p>
            <p className="text-xs" style={{ color: c.faint }}>UVCE</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); onClose && onClose(); }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
                style={{ background: active ? `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` : 'transparent', color: active ? '#fff' : c.subtext }}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        {isVisitor ? (
          <Glass className="p-4 mt-4 text-center">
            <p className="text-xs font-semibold" style={{ color: PALETTE.amber }}>Visitor Access</p>
            <p className="text-xs mt-0.5 mb-2.5" style={{ color: c.faint }}>Campus Navigation & Announcements</p>
            <button
              onClick={() => setShowLogin && setShowLogin(true)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}
            >
              Sign In / Register
            </button>
          </Glass>
        ) : (
          <Glass className="p-4 mt-4">
            <p className="text-xs font-semibold" style={{ color: c.text }}>Attendance health</p>
            <p className="text-xs mt-0.5" style={{ color: c.faint }}>Keep every subject above 75%</p>
          </Glass>
        )}
      </aside>
    </>
  );
}

function Topbar({ onMenuClick }) {
  const { c, setTab, apiOnline, session, signOut, data, role, setShowLogin } = useApp();
  const isVisitor = role === 'visitor';
  const STUDENTS = data.students;
  const SUBJECTS = data.subjects;
  const ANNOUNCEMENTS = data.announcements;
  const NOTIFICATIONS = data.notifications;
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out = [];
    if (!isVisitor) {
      STUDENTS.forEach((s) => { if (s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q)) out.push({ type: 'Student', label: s.name, sub: s.usn, tab: 'students' }); });
      SUBJECTS.forEach((s) => { if (s.name.toLowerCase().includes(q)) out.push({ type: 'Subject', label: s.name, sub: s.faculty, tab: 'attendance' }); });
    }
    NAV_BUILDINGS.forEach((b) => { if (b.label.toLowerCase().includes(q)) out.push({ type: 'Building', label: b.label, sub: 'Campus map', tab: 'campus' }); });
    ANNOUNCEMENTS.forEach((a) => { if (a.title.toLowerCase().includes(q)) out.push({ type: 'Announcement', label: a.title, sub: a.author, tab: 'announcements' }); });
    return out.slice(0, 6);
  }, [query, STUDENTS, SUBJECTS, ANNOUNCEMENTS, isVisitor]);

  const initials = session ? session.user.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : (isVisitor ? 'VS' : 'AS');

  return (
    <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 pt-5 pb-3">
      <Glass className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
        <button className="lg:hidden p-1.5 rounded-xl" onClick={onMenuClick} style={{ color: c.text }}>
          <Menu size={20} />
        </button>
        <div className="relative flex-1">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: c.input }}>
            <Search size={16} style={{ color: c.faint }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isVisitor ? "Search buildings, locations, notices…" : "Search students, subjects, buildings…"}
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color: c.text }}
            />
          </div>
          {results.length > 0 && (
            <Glass className="absolute top-full mt-2 left-0 right-0 p-2 max-h-72 overflow-auto z-40">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setTab(r.tab); setQuery(''); }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-black/5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: c.text }}>{r.label}</p>
                    <p className="text-xs" style={{ color: c.faint }}>{r.sub}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.panelSoft, color: c.subtext }}>{r.type}</span>
                </button>
              ))}
            </Glass>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setNotifOpen((o) => !o)} className="p-2.5 rounded-full relative" style={{ background: c.panelSoft }}>
            <Bell size={17} style={{ color: c.text }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: PALETTE.softRed }} />
          </button>
          {notifOpen && (
            <Glass className="absolute top-full mt-2 right-0 w-80 p-2 z-40">
              <p className="text-xs font-semibold px-2 py-1.5" style={{ color: c.text }}>Notifications</p>
              {NOTIFICATIONS.length === 0 && <p className="text-xs px-2.5 py-3" style={{ color: c.faint }}>You're all caught up.</p>}
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="px-2.5 py-2.5 rounded-xl flex gap-2.5 items-start hover:bg-black/5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: n.type === 'warning' ? PALETTE.softRed : PALETTE.appleBlue }} />
                  <div>
                    <p className="text-xs" style={{ color: c.text }}>{n.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: c.faint }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </Glass>
          )}
        </div>

        <div className="hidden sm:block"><ThemeToggle /></div>
        {!session && !isVisitor && <div className="hidden md:block"><RoleSwitch /></div>}

        {isVisitor && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
            <User size={12} /> Visitor Mode
          </span>
        )}

        {apiOnline && (
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(18,185,129,0.15)', color: '#0F9D6E' }}>
            <Wifi size={12} /> API live
          </span>
        )}

        {!session && (
          <button
            onClick={() => setShowLogin && setShowLogin(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shrink-0 hover:opacity-90 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}
          >
            Sign In / Register
          </button>
        )}

        <div className="relative">
          <button onClick={() => setUserMenuOpen((o) => !o)} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: isVisitor ? `linear-gradient(135deg, ${PALETTE.amber}, #F59E0B)` : `linear-gradient(135deg, ${PALETTE.appleBlue}, #8B5CF6)` }}>
            {initials}
          </button>
          {userMenuOpen && (
            <Glass className="absolute top-full mt-2 right-0 w-60 p-2 z-40">
              {session ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold" style={{ color: c.text }}>{session.user.name}</p>
                    <p className="text-xs" style={{ color: c.faint }}>{session.user.email} · {session.user.role}</p>
                  </div>
                  <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-black/5" style={{ color: PALETTE.softRed }}>
                    <LogOut size={14} /> Sign out
                  </button>
                </>
              ) : (
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { setShowLogin && setShowLogin(true); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5"
                    style={{ color: c.text }}
                  >
                    <GraduationCap size={14} className="text-blue-500" /> Student or Teacher Sign In
                  </button>
                </div>
              )}
            </Glass>
          )}
        </div>
      </Glass>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboards                                                          */
/* ------------------------------------------------------------------ */
function DashboardStudent() {
  const { c, data } = useApp();
  const CURRENT_STUDENT = data.currentStudent;
  const SUBJECTS = data.subjects;
  const ATTENDANCE = data.attendance;
  const TIMETABLE = data.timetable;
  const ANNOUNCEMENTS = data.announcements;
  const overall = attendancePercent(ATTENDANCE, CURRENT_STUDENT.id);
  const trendData = DATES.map((d) => {
    const dayRecs = ATTENDANCE.filter((r) => r.studentId === CURRENT_STUDENT.id && r.date === d);
    const present = dayRecs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    return { date: d, pct: dayRecs.length ? Math.round((present / dayRecs.length) * 100) : 0 };
  });
  const subjectData = SUBJECTS.map((s) => ({ name: s.code, pct: attendancePercent(ATTENDANCE, CURRENT_STUDENT.id, s.id) }));
  const today = 'Thu';
  const todaysClasses = TIMETABLE[today]
    .map((sid, i) => (sid ? { subject: SUBJECTS.find((s) => s.id === sid), time: PERIODS[i] } : null))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <Glass className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5" style={{ background: 'linear-gradient(120deg, rgba(10,132,255,0.12), rgba(139,92,246,0.08))' }}>
        <div>
          <p className="text-sm" style={{ color: c.subtext }}>Welcome back,</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>{CURRENT_STUDENT.name.split(' ')[0]}</h1>
          <p className="text-xs mt-2" style={{ color: c.faint }}>{CURRENT_STUDENT.usn} · Sem {CURRENT_STUDENT.sem} · Section {CURRENT_STUDENT.section} · {CURRENT_STUDENT.branch}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" style={{ color: overall < 75 ? PALETTE.softRed : PALETTE.emerald }}>{overall}%</p>
          <p className="text-xs" style={{ color: c.faint }}>overall attendance</p>
        </div>
      </Glass>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Overall" value={`${overall}%`} sub="This semester" />
        <StatCard icon={BookOpen} label="Subjects" value={SUBJECTS.length} sub="Enrolled" />
        <StatCard icon={CalendarDays} label="Today" value={todaysClasses.length} sub="Classes" />
        <StatCard icon={Megaphone} label="Updates" value={ANNOUNCEMENTS.length} sub="Announcements" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Glass className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: c.text }}>Attendance trend</h3>
            <TrendingUp size={16} style={{ color: PALETTE.emerald }} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.appleBlue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PALETTE.appleBlue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={c.divider} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: c.panel }} />
              <Area type="monotone" dataKey="pct" stroke={PALETTE.appleBlue} strokeWidth={2.5} fill="url(#trendFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Glass>

        <Glass className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: c.text }}>Today's timetable</h3>
          <div className="space-y-3">
            {todaysClasses.length === 0 && <p className="text-sm" style={{ color: c.faint }}>No classes today.</p>}
            {todaysClasses.map((cls, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-10 rounded-full" style={{ background: cls.subject.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: c.text }}>{cls.subject.name}</p>
                  <p className="text-xs" style={{ color: c.faint }}>{cls.subject.faculty}</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: c.subtext }}>{cls.time}</span>
              </div>
            ))}
          </div>
        </Glass>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Glass className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4" style={{ color: c.text }}>Subject-wise attendance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.divider} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: c.panel }} />
              <Bar dataKey="pct" radius={[8, 8, 0, 0]} fill={PALETTE.appleBlue} />
            </BarChart>
          </ResponsiveContainer>
        </Glass>

        <Glass className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: c.text }}>Announcements</h3>
          <div className="space-y-3">
            {ANNOUNCEMENTS.slice(0, 3).map((a) => (
              <div key={a.id} className="pb-3 border-b last:border-0" style={{ borderColor: c.divider }}>
                <p className="text-sm font-medium" style={{ color: c.text }}>{a.title}</p>
                <p className="text-xs mt-1" style={{ color: c.faint }}>{a.author} · {a.date}</p>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
}

function DashboardTeacher() {
  const { c, setTab, data } = useApp();
  const STUDENTS = data.students;
  const SUBJECTS = data.subjects;
  const ATTENDANCE = data.attendance;
  const ANNOUNCEMENTS = data.announcements;
  const todayDate = DATES[DATES.length - 1];
  const todayRecs = ATTENDANCE.filter((r) => r.date === todayDate);
  const presentToday = todayRecs.filter((r) => r.status === 'Present').length;
  const pendingSubjects = SUBJECTS.length - new Set(todayRecs.map((r) => r.subjectId)).size;

  const trendBySubject = SUBJECTS.map((s) => {
    const recs = ATTENDANCE.filter((r) => r.subjectId === s.id);
    const present = recs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    return { name: s.code, pct: recs.length ? Math.round((present / recs.length) * 100) : 0 };
  });

  const statusBreakdown = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, 'Medical Leave': 0 };
    ATTENDANCE.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ATTENDANCE]);
  const pieColors = [PALETTE.emerald, PALETTE.softRed, PALETTE.amber, PALETTE.appleBlue];

  return (
    <div className="space-y-6">
      <Glass className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5" style={{ background: 'linear-gradient(120deg, rgba(10,132,255,0.12), rgba(16,185,129,0.08))' }}>
        <div>
          <p className="text-sm" style={{ color: c.subtext }}>Good to see you,</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>Dr. Anitha Rao</h1>
          <p className="text-xs mt-2" style={{ color: c.faint }}>CSE Department · Faculty Advisor, Sem 5 Section A</p>
        </div>
        <button onClick={() => setTab('attendance')} className="px-5 py-2.5 rounded-full text-sm font-semibold text-white flex items-center gap-2 shrink-0" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
          <Plus size={16} /> Quick attendance
        </button>
      </Glass>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total students" value={STUDENTS.length} sub="Across sections" />
        <StatCard icon={CheckCircle2} label="Present today" value={presentToday} sub={todayDate} tint="rgba(16,185,129,0.15)" />
        <StatCard icon={AlertCircle} label="Pending" value={pendingSubjects} sub="Subjects to mark" tint="rgba(245,166,35,0.18)" />
        <StatCard icon={BookOpen} label="Subjects" value={SUBJECTS.length} sub="You teach" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Glass className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4" style={{ color: c.text }}>Attendance by subject</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={trendBySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.divider} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: c.faint }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: c.panel }} />
              <Bar dataKey="pct" radius={[8, 8, 0, 0]} fill={PALETTE.appleBlue} />
            </BarChart>
          </ResponsiveContainer>
        </Glass>
        <Glass className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: c.text }}>Status breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {statusBreakdown.map((entry, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {statusBreakdown.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: c.subtext }}>
                <span className="w-2 h-2 rounded-full" style={{ background: pieColors[i] }} /> {s.name}
              </div>
            ))}
          </div>
        </Glass>
      </div>

      <Glass className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: c.text }}>Recent updates</h3>
          <button onClick={() => setTab('students')} className="text-xs font-semibold flex items-center gap-1" style={{ color: PALETTE.appleBlue }}>View students <ChevronRight size={14} /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ANNOUNCEMENTS.slice(0, 4).map((a) => (
            <div key={a.id} className="p-3.5 rounded-2xl flex items-start gap-3" style={{ background: c.panelSoft }}>
              <Megaphone size={16} className="mt-0.5 shrink-0" style={{ color: PALETTE.appleBlue }} />
              <div>
                <p className="text-sm font-medium" style={{ color: c.text }}>{a.title}</p>
                <p className="text-xs mt-1" style={{ color: c.faint }}>{a.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attendance — the core module                                        */
/* ------------------------------------------------------------------ */
function MarkAttendanceModal({ subject, date, period, onClose }) {
  const { showToast, session, refreshLiveData, data } = useApp();
  const STUDENTS = data.students;
  const [statuses, setStatuses] = useState(() => Object.fromEntries(STUDENTS.map((s) => [s.id, 'Present'])));
  const [saving, setSaving] = useState(false);
  const order = ['Present', 'Absent', 'Late', 'Medical Leave'];

  const save = async () => {
    if (session) {
      setSaving(true);
      try {
        await api.markAttendance(session.accessToken, {
          subjectId: subject.id,
          date: DATE_TO_ISO[date] || date,
          period,
          entries: STUDENTS.map((s) => ({ studentId: s.id, status: statuses[s.id] })),
        });
        await refreshLiveData();
        showToast(`Attendance saved for ${STUDENTS.length} students`);
        onClose();
      } catch (err) {
        showToast(err.message || 'Could not save attendance');
        setSaving(false);
      }
    } else {
      showToast(`Attendance saved for ${STUDENTS.length} students`);
      onClose();
    }
  };

  return (
    <Modal title={`Mark attendance · ${subject.name}`} onClose={onClose}>
      <p className="text-xs mb-4" style={{ color: 'inherit', opacity: 0.6 }}>{date} · Bulk entry for {STUDENTS.length} students · tap a badge to cycle status</p>
      <div className="space-y-2 max-h-80 overflow-auto pr-1">
        {STUDENTS.map((s) => (
          <StatusRow key={s.id} student={s} status={statuses[s.id]} onCycle={() => setStatuses((st) => ({ ...st, [s.id]: order[(order.indexOf(st[s.id]) + 1) % order.length] }))} />
        ))}
      </div>
      <button
        disabled={saving}
        onClick={save}
        className="w-full mt-5 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}
      >
        {saving ? 'Saving…' : 'Save attendance'}
      </button>
    </Modal>
  );
}
function StatusRow({ student, status, onCycle }) {
  const { c } = useApp();
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: c.panelSoft }}>
      <div>
        <p className="text-sm font-medium" style={{ color: c.text }}>{student.name}</p>
        <p className="text-xs" style={{ color: c.faint }}>{student.usn}</p>
      </div>
      <button onClick={onCycle}><StatusBadge status={status} /></button>
    </div>
  );
}

function AttendancePage() {
  const { c, role, showToast, session, refreshLiveData, data } = useApp();
  const STUDENTS = data.students;
  const SUBJECTS = data.subjects;
  const ATTENDANCE = data.attendance;
  const CURRENT_STUDENT = data.currentStudent;
  const [subjectFilter, setSubjectFilter] = useState(SUBJECTS[0].id);
  const [sectionFilter, setSectionFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(DATES[DATES.length - 1]);
  const [search, setSearch] = useState('');
  const [markOpen, setMarkOpen] = useState(false);
  const [localOverrides, setLocalOverrides] = useState({});
  const studentView = role === 'student';

  const rows = useMemo(() => {
    let recs = ATTENDANCE.filter((r) => r.subjectId === subjectFilter);
    recs = studentView ? recs.filter((r) => r.studentId === CURRENT_STUDENT.id) : recs.filter((r) => r.date === dateFilter);
    return recs
      .map((r) => ({ ...r, status: localOverrides[r.id] || r.status, student: STUDENTS.find((s) => s.id === r.studentId) }))
      .filter((r) => r.student)
      .filter((r) => sectionFilter === 'All' || r.student.section === sectionFilter)
      .filter((r) => !search || r.student.name.toLowerCase().includes(search.toLowerCase()) || r.student.usn.toLowerCase().includes(search.toLowerCase()));
  }, [ATTENDANCE, STUDENTS, subjectFilter, sectionFilter, dateFilter, search, localOverrides, studentView, CURRENT_STUDENT]);

  const cycleStatus = async (id) => {
    const order = ['Present', 'Absent', 'Late', 'Medical Leave'];
    const rec = ATTENDANCE.find((r) => r.id === id);
    const current = localOverrides[id] || rec.status;
    const next = order[(order.indexOf(current) + 1) % order.length];

    if (session) {
      setLocalOverrides((o) => ({ ...o, [id]: next })); // optimistic
      try {
        await api.updateAttendance(session.accessToken, id, next);
        await refreshLiveData();
        setLocalOverrides((o) => { const { [id]: _drop, ...rest } = o; return rest; });
      } catch (err) {
        showToast(err.message || 'Could not update attendance');
      }
    } else {
      setLocalOverrides((o) => ({ ...o, [id]: next }));
    }
  };

  const removeRecord = async (row) => {
    if (session) {
      try {
        await api.deleteAttendance(session.accessToken, row.id);
        await refreshLiveData();
        showToast(`Removed record for ${row.student.name}`);
      } catch (err) {
        showToast(err.message || 'Could not remove record');
      }
    } else {
      showToast(`Removed record for ${row.student.name}`);
    }
  };

  const subjectSummary = SUBJECTS.map((s) => ({ subject: s, pct: attendancePercent(ATTENDANCE, CURRENT_STUDENT.id, s.id) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: c.text }}>Attendance</h1>
          <p className="text-sm mt-1" style={{ color: c.subtext }}>{studentView ? 'Your attendance across subjects' : 'Mark, review and analyse class attendance'}</p>
        </div>
        {!studentView && (
          <div className="flex gap-2">
            <button onClick={() => showToast('Exported attendance to CSV')} className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: c.panelSoft, color: c.text, border: `1px solid ${c.panelBorder}` }}>
              <Download size={14} /> Export
            </button>
            <button onClick={() => setMarkOpen(true)} className="px-4 py-2 rounded-full text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
              <Plus size={14} /> Mark attendance
            </button>
          </div>
        )}
      </div>

      {studentView && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {subjectSummary.map(({ subject, pct }) => (
            <Glass key={subject.id} className="p-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${pct < 75 ? PALETTE.softRed : PALETTE.appleBlue} ${pct * 3.6}deg, ${c.panelSoft} 0deg)` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c.pageBg, color: c.text }}>{pct}%</div>
              </div>
              <p className="text-xs font-medium mt-2 truncate" style={{ color: c.text }}>{subject.code}</p>
            </Glass>
          ))}
        </div>
      )}

      <Glass className="p-4 flex flex-wrap gap-3 items-center">
        <Filter size={15} style={{ color: c.faint }} />
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="text-xs font-medium px-3 py-2 rounded-full outline-none" style={{ background: c.panelSoft, color: c.text }}>
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {!studentView && (
          <>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="text-xs font-medium px-3 py-2 rounded-full outline-none" style={{ background: c.panelSoft, color: c.text }}>
              {['All', 'A', 'B'].map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-xs font-medium px-3 py-2 rounded-full outline-none" style={{ background: c.panelSoft, color: c.text }}>
              {DATES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1" style={{ background: c.panelSoft }}>
              <Search size={13} style={{ color: c.faint }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…" className="bg-transparent outline-none text-xs flex-1" style={{ color: c.text }} />
            </div>
          </>
        )}
      </Glass>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.divider}` }}>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: c.faint }}>Student</th>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: c.faint }}>USN</th>
                <th className="text-left px-5 py-3 font-medium text-xs hidden sm:table-cell" style={{ color: c.faint }}>Date</th>
                <th className="text-left px-5 py-3 font-medium text-xs hidden sm:table-cell" style={{ color: c.faint }}>Period</th>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: c.faint }}>Status</th>
                {!studentView && <th className="text-right px-5 py-3 font-medium text-xs" style={{ color: c.faint }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map((r) => (
                <tr key={r.id} className="hover:bg-black/5" style={{ borderBottom: `1px solid ${c.divider}` }}>
                  <td className="px-5 py-3" style={{ color: c.text }}>{r.student.name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: c.faint }}>{r.student.usn}</td>
                  <td className="px-5 py-3 text-xs hidden sm:table-cell" style={{ color: c.subtext }}>{r.date}</td>
                  <td className="px-5 py-3 text-xs hidden sm:table-cell" style={{ color: c.subtext }}>{r.period}</td>
                  <td className="px-5 py-3">
                    {studentView ? <StatusBadge status={r.status} /> : <button onClick={() => cycleStatus(r.id)}><StatusBadge status={r.status} /></button>}
                  </td>
                  {!studentView && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => removeRecord(r)} className="p-1.5 rounded-lg" style={{ color: c.faint }}><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>

      {markOpen && <MarkAttendanceModal subject={SUBJECTS.find((s) => s.id === subjectFilter)} date={dateFilter} period={DATES.indexOf(dateFilter) % 6 + 1} onClose={() => setMarkOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Students, Timetable, Announcements, Profile                         */
/* ------------------------------------------------------------------ */
function Avatar({ name, size = 12 }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const dim = size === 12 ? 'w-12 h-12 text-sm' : size === 16 ? 'w-16 h-16 text-lg' : 'w-20 h-20 text-2xl';
  return (
    <div className={`rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${dim}`} style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #8B5CF6)` }}>
      {initials}
    </div>
  );
}

function StudentsPage() {
  const { c, role, data } = useApp();
  const STUDENTS = data.students;
  const SUBJECTS = data.subjects;
  const ATTENDANCE = data.attendance;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = STUDENTS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.usn.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: c.text }}>Students</h1>
          <p className="text-sm mt-1" style={{ color: c.subtext }}>{role === 'teacher' ? 'Sem 5 · CSE · Sections A & B' : 'Your classmates this semester'}</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: c.panelSoft }}>
          <Search size={14} style={{ color: c.faint }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or USN…" className="bg-transparent outline-none text-sm" style={{ color: c.text }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const pct = attendancePercent(ATTENDANCE, s.id);
          return (
            <Glass key={s.id} className="p-5 flex items-center gap-3.5 cursor-pointer hover:-translate-y-0.5 transition-transform duration-300" onClick={() => setSelected(s)}>
              <Avatar name={s.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: c.text }}>{s.name}</p>
                <p className="text-xs" style={{ color: c.faint }}>{s.usn} · Sec {s.section}</p>
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: pct < 75 ? PALETTE.softRed : PALETTE.emerald }}>{pct}%</span>
            </Glass>
          );
        })}
      </div>

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={selected.name} size={16} />
            <div>
              <p className="font-semibold" style={{ color: 'inherit' }}>{selected.name}</p>
              <p className="text-xs opacity-60">{selected.usn} · Sem {selected.sem} · Sec {selected.section} · {selected.branch}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SUBJECTS.slice(0, 6).map((sub) => (
              <SubjectMini key={sub.id} sub={sub} pct={attendancePercent(ATTENDANCE, selected.id, sub.id)} />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
function SubjectMini({ sub, pct }) {
  const { c } = useApp();
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: c.panelSoft }}>
      <p className="text-xs" style={{ color: c.faint }}>{sub.code}</p>
      <p className="text-sm font-bold mt-1" style={{ color: c.text }}>{pct}%</p>
    </div>
  );
}

function TimetablePage() {
  const { c, data } = useApp();
  const SUBJECTS = data.subjects;
  const TIMETABLE = data.timetable;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: c.text }}>Timetable</h1>
        <p className="text-sm mt-1" style={{ color: c.subtext }}>Sem 5 · CSE · Section A</p>
      </div>
      <Glass className="p-3 sm:p-6 overflow-x-auto">
        <table className="w-full min-w-[600px] border-separate" style={{ borderSpacing: '6px' }}>
          <thead>
            <tr>
              <th className="text-xs font-medium w-20"></th>
              {DAYS.map((d) => <th key={d} className="text-xs font-semibold px-2 py-2" style={{ color: c.text }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((time, pi) => (
              <tr key={time}>
                <td className="text-xs font-medium pr-2 whitespace-nowrap" style={{ color: c.faint }}>{time}</td>
                {DAYS.map((day) => {
                  const sid = TIMETABLE[day][pi];
                  const subject = sid && SUBJECTS.find((s) => s.id === sid);
                  return (
                    <td key={day} className="p-0">
                      {subject ? (
                        <div className="rounded-xl px-2.5 py-2.5 text-center" style={{ background: `${subject.color}1f` }}>
                          <p className="text-xs font-semibold" style={{ color: subject.color }}>{subject.code}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl px-2.5 py-2.5 text-center" style={{ background: c.panelSoft }}>
                          <p className="text-xs" style={{ color: c.faint }}>—</p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    </div>
  );
}

function AnnouncementsPage() {
  const { c, role, showToast, session, refreshLiveData, data } = useApp();
  const ANNOUNCEMENTS = data.announcements;
  const [postOpen, setPostOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!title.trim() || !body.trim()) { showToast('Add a title and details first'); return; }
    if (session) {
      setPosting(true);
      try {
        await api.postAnnouncement(session.accessToken, { title, body, tag: 'Notice' });
        await refreshLiveData();
        showToast('Announcement posted');
        setTitle(''); setBody(''); setPostOpen(false);
      } catch (err) {
        showToast(err.message || 'Could not post announcement');
      } finally {
        setPosting(false);
      }
    } else {
      showToast('Announcement posted');
      setTitle(''); setBody(''); setPostOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: c.text }}>Announcements</h1>
          <p className="text-sm mt-1" style={{ color: c.subtext }}>Notices, circulars and updates</p>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setPostOpen(true)} className="px-4 py-2 rounded-full text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
            <Plus size={14} /> New announcement
          </button>
        )}
      </div>
      <div className="space-y-3">
        {ANNOUNCEMENTS.map((a) => (
          <Glass key={a.id} className="p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(10,132,255,0.12)' }}>
              <Megaphone size={18} style={{ color: PALETTE.appleBlue }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: c.text }}>{a.title}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.panelSoft, color: c.subtext }}>{a.tag}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: c.faint }}>{a.author} · {a.date}</p>
            </div>
            {a.hasAttachment && (
              <button onClick={() => showToast('Downloading attachment…')} className="p-2 rounded-xl shrink-0" style={{ background: c.panelSoft }}>
                <Download size={15} style={{ color: c.subtext }} />
              </button>
            )}
          </Glass>
        ))}
      </div>
      {postOpen && (
        <Modal title="New announcement" onClose={() => setPostOpen(false)}>
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'rgba(120,120,128,0.12)', color: 'inherit' }} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details…" rows={4} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: 'rgba(120,120,128,0.12)', color: 'inherit' }} />
            <button disabled={posting} onClick={post} className="w-full py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
              {posting ? 'Posting…' : 'Post announcement'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfilePage() {
  const { c, role, session, refreshLiveData, showToast, data } = useApp();
  const CURRENT_STUDENT = data.currentStudent;
  const ATTENDANCE = data.attendance;
  const teacherInfo = session && session.user.role === 'TEACHER' ? { name: session.user.name, branch: 'CSE' } : { name: 'Dr. Anitha Rao', branch: 'CSE' };
  const person = role === 'student' ? CURRENT_STUDENT : teacherInfo;
  const pct = role === 'student' ? attendancePercent(ATTENDANCE, CURRENT_STUDENT.id) : null;

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(person.phone || '+91 98••• •••42');
  const [saving, setSaving] = useState(false);

  const savePhone = async () => {
    if (session) {
      setSaving(true);
      try {
        await api.updateProfile(session.accessToken, { phone });
        await refreshLiveData();
        showToast('Contact info updated');
        setEditing(false);
      } catch (err) {
        showToast(err.message || 'Could not save');
      } finally {
        setSaving(false);
      }
    } else {
      showToast('Contact info updated');
      setEditing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold" style={{ color: c.text }}>Profile</h1>
      <Glass className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <Avatar name={person.name} size={20} />
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: c.text }}>{person.name}</h2>
            <p className="text-xs mt-1" style={{ color: c.faint }}>
              {role === 'student' ? `${person.usn} · Sem ${person.sem} · Sec ${person.section} · ${person.branch}` : `${person.branch} Department · Faculty`}
            </p>
            {role === 'student' && !editing && (
              <button onClick={() => setEditing(true)} className="text-xs font-semibold mt-3 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background: c.panelSoft, color: c.text }}>
                <Pencil size={12} /> Edit contact info
              </button>
            )}
            {role === 'student' && editing && (
              <div className="flex items-center gap-2 mt-3">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3 py-1.5 rounded-full text-xs outline-none" style={{ background: c.panelSoft, color: c.text }} />
                <button disabled={saving} onClick={savePhone} className="text-xs font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-60" style={{ background: PALETTE.appleBlue }}>{saving ? '…' : 'Save'}</button>
                <button onClick={() => setEditing(false)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: c.panelSoft, color: c.subtext }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </Glass>
      <div className="grid sm:grid-cols-2 gap-4">
        <Glass className="p-5">
          <p className="text-xs font-medium" style={{ color: c.faint }}>Email</p>
          <p className="text-sm mt-1" style={{ color: c.text }}>{person.email || `${person.name.toLowerCase().replace(' ', '.')}@uvce.ac.in`}</p>
        </Glass>
        <Glass className="p-5">
          <p className="text-xs font-medium" style={{ color: c.faint }}>Phone</p>
          <p className="text-sm mt-1" style={{ color: c.text }}>{phone}</p>
        </Glass>
        {role === 'student' && (
          <>
            <Glass className="p-5">
              <p className="text-xs font-medium" style={{ color: c.faint }}>Attendance</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: pct < 75 ? PALETTE.softRed : PALETTE.emerald }}>{pct}%</p>
            </Glass>
            <Glass className="p-5">
              <p className="text-xs font-medium" style={{ color: c.faint }}>Faculty advisor</p>
              <p className="text-sm mt-1" style={{ color: c.text }}>Dr. Anitha Rao</p>
            </Glass>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campus Navigation — Leaflet GPS Real-World Engine                  */
/* ------------------------------------------------------------------ */
function CampusPage() {
  const { c, dark, session } = useApp();
  return <CampusNavigation dark={dark} c={c} session={session} api={api} />;
}

/* ------------------------------------------------------------------ */
/* Root                                                                 */
/* ------------------------------------------------------------------ */
function PageSkeleton() {
  const { c } = useApp();
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-3xl animate-pulse" style={{ background: c.panelSoft }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-3xl animate-pulse" style={{ background: c.panelSoft }} />)}
      </div>
      <div className="h-64 rounded-3xl animate-pulse" style={{ background: c.panelSoft }} />
    </div>
  );
}

function VisitorRestricted({ onSignIn }) {
  const { c } = useApp();
  return (
    <Glass className="p-8 sm:p-12 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
        <ShieldCheck size={32} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: c.text }}>Restricted Access for Visitors</h2>
      <p className="text-sm mb-6 max-w-md" style={{ color: c.subtext }}>
        Student and teacher personal details, attendance records, timetables, and directories are private. Please sign in or register to access these details.
      </p>
      <button
        onClick={onSignIn}
        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-md hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}
      >
        Sign In or Register
      </button>
    </Glass>
  );
}

function LoginScreen({ onLogin, onCancel, onVisitor }) {
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'TEACHER'
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Common fields
  const [email, setEmail] = useState('aditya.sharma@uvce.ac.in');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('');

  // Student specific fields
  const [usn, setUsn] = useState('1VE22CS099');
  const [departmentId, setDepartmentId] = useState('CSE');
  const [semester, setSemester] = useState('5');
  const [sectionId, setSectionId] = useState('A');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (mode === 'login') {
      setEmail(newRole === 'TEACHER' ? 'anitha.rao@uvce.ac.in' : 'aditya.sharma@uvce.ac.in');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'login') {
        const result = await api.login(email, password, role);
        onLogin(result);
      } else {
        const payload = {
          name,
          email,
          password,
          role,
          departmentId: departmentId || 'CSE',
          ...(role === 'STUDENT'
            ? {
                usn,
                semester: parseInt(semester, 10) || 5,
                sectionId: sectionId || 'A',
              }
            : {}),
        };
        const result = await api.register(payload);
        onLogin(result);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4" style={{ background: '#F8FAFC', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif" }}>
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-8" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', boxShadow: '0 20px 50px rgba(30,41,59,0.14)', border: '1px solid rgba(255,255,255,0.9)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Smart Campus UVCE</h1>
              <p className="text-xs text-slate-500">Access Portal</p>
            </div>
          </div>
        </div>

        {/* Role Selector: Student vs Teacher */}
        <div className="flex rounded-2xl p-1 mb-5" style={{ background: 'rgba(120,120,128,0.12)' }}>
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: role === 'STUDENT' ? '#FFFFFF' : 'transparent',
              color: role === 'STUDENT' ? PALETTE.appleBlue : '#6E7480',
              boxShadow: role === 'STUDENT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <GraduationCap size={15} /> Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('TEACHER')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: role === 'TEACHER' ? '#FFFFFF' : 'transparent',
              color: role === 'TEACHER' ? PALETTE.appleBlue : '#6E7480',
              boxShadow: role === 'TEACHER' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <BookOpen size={15} /> Teacher / Faculty
          </button>
        </div>

        {/* Mode Toggle: Log In vs Sign Up */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-2">
          <h2 className="text-sm font-semibold text-slate-800">
            {role === 'STUDENT' ? 'Student' : 'Teacher'} {mode === 'login' ? 'Sign In' : 'Account Registration'}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`font-semibold ${mode === 'login' ? 'text-blue-600 underline' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`font-semibold ${mode === 'register' ? 'text-blue-600 underline' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Full Name (e.g. Rahul Sharma)"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-blue-400 text-slate-800"
            />
          )}

          <input
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder={role === 'STUDENT' ? 'Student Email (e.g. aditya.sharma@uvce.ac.in)' : 'Teacher Email (e.g. anitha.rao@uvce.ac.in)'}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-blue-400 text-slate-800"
          />

          <div className="relative">
            <input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min. 8 chars)"
              className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-blue-400 text-slate-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  type="text"
                  placeholder="Department (e.g. CSE)"
                  className="px-4 py-2 rounded-xl text-xs outline-none bg-slate-100/70 text-slate-800"
                />
                {role === 'STUDENT' ? (
                  <input
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    type="text"
                    placeholder="USN (e.g. 1VE22CS099)"
                    className="px-4 py-2 rounded-xl text-xs outline-none bg-slate-100/70 text-slate-800"
                  />
                ) : (
                  <div className="px-4 py-2 rounded-xl text-xs text-slate-400 bg-slate-100/40 flex items-center">
                    Faculty Member
                  </div>
                )}
              </div>

              {role === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none bg-slate-100/70 text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none bg-slate-100/70 text-slate-800"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              )}
            </>
          )}

          {error && <p className="text-xs p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</p>}

          <button
            disabled={busy}
            type="submit"
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 shadow-md hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}
          >
            {busy
              ? 'Processing…'
              : mode === 'login'
              ? `Sign In as ${role === 'STUDENT' ? 'Student' : 'Teacher'}`
              : `Register as ${role === 'STUDENT' ? 'Student' : 'Teacher'}`}
          </button>
        </form>

        {/* Visitor Option Section */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
          <button
            type="button"
            onClick={onVisitor}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            <Navigation size={14} className="text-blue-500" /> Continue as Visitor / Guest
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            Visitors can view campus map navigation & notices without signing in.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SmartCampusApp() {
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState('student');
  const [tab, setTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // --- live backend wiring --------------------------------------------
  const [apiOnline, setApiOnline] = useState(false);
  const [session, setSession] = useState(null); // { accessToken, user } | null
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.health().then((ok) => { if (!cancelled) setApiOnline(ok); }).catch(() => { if (!cancelled) setApiOnline(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!session) { setLiveData(null); return; }
    let cancelled = false;
    setLiveLoading(true);
    fetchAllLiveData(session.accessToken)
      .then((d) => { if (!cancelled) setLiveData(d); })
      .catch(() => {
        if (!cancelled) { setSession(null); setToast('Session expired — please sign in again'); setTimeout(() => setToast(null), 2400); }
      })
      .finally(() => { if (!cancelled) setLiveLoading(false); });
    return () => { cancelled = true; };
  }, [session]);

  const refreshLiveData = async () => {
    if (!session) return;
    try {
      const fresh = await fetchAllLiveData(session.accessToken);
      setLiveData(fresh);
    } catch (err) {
      setSession(null);
    }
  };

  const signOut = async () => {
    if (session) {
      try { await apiRequest('/auth/logout', { method: 'POST' }); } catch (err) { /* best effort */ }
    }
    setSession(null);
    setLiveData(null);
    setRole('visitor');
    setTab('campus');
  };

  const handleLogin = (loginResult) => {
    setSession({ accessToken: loginResult.accessToken, user: loginResult.user });
    const userRole = loginResult.user.role.toLowerCase();
    setRole(userRole);
    setTab('dashboard');
    setShowLogin(false);
  };

  const handleVisitorMode = () => {
    setSession(null);
    setRole('visitor');
    setTab('campus');
    setShowLogin(false);
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [tab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const c = dark ? THEME.dark : THEME.light;
  const effectiveRole = session ? session.user.role.toLowerCase() : role;

  const resolvedStudents = liveData ? liveData.students : STUDENTS;
  const currentStudent =
    session && session.user.role === 'STUDENT'
      ? resolvedStudents.find((s) => s.id === session.user.student?.id) || resolvedStudents[0]
      : resolvedStudents[0];

  const data = {
    students: resolvedStudents,
    subjects: liveData ? liveData.subjects : SUBJECTS,
    attendance: liveData ? liveData.attendance : ATTENDANCE_RECORDS,
    timetable: liveData ? liveData.timetable : TIMETABLE,
    announcements: liveData ? liveData.announcements : ANNOUNCEMENTS,
    notifications: liveData ? liveData.notifications : NOTIFICATIONS,
    currentStudent,
  };

  const ctx = { c, dark, setDark, role: effectiveRole, setRole, tab, setTab, showToast, apiOnline, session, signOut, refreshLiveData, data, setShowLogin };

  const pages = {
    dashboard: effectiveRole === 'visitor' ? <VisitorRestricted onSignIn={() => setShowLogin(true)} /> : (effectiveRole === 'student' ? <DashboardStudent /> : <DashboardTeacher />),
    attendance: effectiveRole === 'visitor' ? <VisitorRestricted onSignIn={() => setShowLogin(true)} /> : <AttendancePage />,
    students: effectiveRole === 'visitor' ? <VisitorRestricted onSignIn={() => setShowLogin(true)} /> : <StudentsPage />,
    timetable: effectiveRole === 'visitor' ? <VisitorRestricted onSignIn={() => setShowLogin(true)} /> : <TimetablePage />,
    announcements: <AnnouncementsPage />,
    campus: <CampusPage />,
    profile: effectiveRole === 'visitor' ? <VisitorRestricted onSignIn={() => setShowLogin(true)} /> : <ProfilePage />,
  };

  if (showLogin && !session) {
    return <LoginScreen onLogin={handleLogin} onCancel={() => setShowLogin(false)} onVisitor={handleVisitorMode} />;
  }

  if (session && liveLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse" style={{ background: `linear-gradient(135deg, ${PALETTE.appleBlue}, #38BDF8)` }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <p className="text-sm" style={{ color: '#6E7480' }}>Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen w-full flex relative" style={{ background: c.pageBg, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif", transition: 'background 0.4s ease', color: c.text }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ width: 500, height: 500, top: -150, left: -100, background: c.blobA, filter: 'blur(90px)' }} />
          <div className="absolute rounded-full" style={{ width: 420, height: 420, bottom: -120, right: -80, background: c.blobC, filter: 'blur(90px)' }} />
        </div>

        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex-1 min-w-0 relative">
          {apiOnline && !session && effectiveRole !== 'visitor' && !bannerDismissed && (
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              <div className="rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-sm" style={{ background: 'rgba(18,185,129,0.12)', color: '#0F9D6E' }}>
                <span className="flex items-center gap-2"><Wifi size={14} /> Backend detected — sign in for live data instead of the demo dataset.</span>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => setShowLogin(true)} className="font-semibold underline">Sign in</button>
                  <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss"><X size={14} /></button>
                </div>
              </div>
            </div>
          )}
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="px-4 sm:px-6 lg:px-8 pb-10">
            <div key={tab} className="animate-fadeUp">
              {loading ? <PageSkeleton /> : pages[tab]}
            </div>
          </main>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Glass className="px-5 py-3 flex items-center gap-2" style={{ background: c.text, color: c.pageBg }}>
              <CheckCircle2 size={15} />
              <span className="text-sm font-medium">{toast}</span>
            </Glass>
          </div>
        )}

        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeUp { animation: fadeUp 0.45s ease; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-thumb { background: ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; border-radius: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
        `}</style>
      </div>
    </AppContext.Provider>
  );
}
