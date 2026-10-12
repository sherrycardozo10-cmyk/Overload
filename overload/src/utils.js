// ---------- units ----------
export const KG_PER_LB = 0.45359237;
export const toDisplay = (kg, unit) => (unit === 'lbs' ? kg / KG_PER_LB : kg);
export const fromDisplay = (v, unit) => (unit === 'lbs' ? v * KG_PER_LB : v);
export const round = (n, d = 1) => {
  const m = 10 ** d;
  return Math.round((Number(n) + Number.EPSILON) * m) / m;
};
export const fmt = (n) => Math.round(n).toLocaleString();
export const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

// ---------- dates (all ISO yyyy-mm-dd, local time) ----------
export const isoDate = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
export const startOfWeek = (iso) => {
  const d = parseISO(iso);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return isoDate(d);
};
export const dayLabel = (iso) => {
  const t = isoDate();
  if (iso === t) return 'Today';
  if (iso === addDays(t, -1)) return 'Yesterday';
  return parseISO(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};
export const shortDate = (iso) =>
  parseISO(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const longDate = (iso) =>
  parseISO(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtClock = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
};

// ---------- constants ----------
export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
export const REST_OPTIONS = [60, 90, 120, 180];
export const GOALS = [
  { id: 'fatloss', label: 'Fat loss' },
  { id: 'muscle', label: 'Muscle gain' },
  { id: 'maintain', label: 'Maintain' },
  { id: 'recomp', label: 'Recomp' },
];
export const ACTIVITY = [
  { id: 'sedentary', label: 'Mostly seated', f: 1.2 },
  { id: 'light', label: 'Light, 1-3 sessions a week', f: 1.375 },
  { id: 'moderate', label: 'Moderate, 3-5 sessions a week', f: 1.55 },
  { id: 'high', label: 'Very active, 6-7 sessions a week', f: 1.725 },
];
export const DEFAULT_SETTINGS = {
  unit: 'kg',
  name: '',
  sex: 'female',
  age: '',
  heightCm: '',
  activity: 'moderate',
  goalType: 'fatloss',
  goalWeightKg: '',
  restSec: 90,
  targets: { calories: 2000, protein: 120, carbs: 220, fat: 65, fibre: 25 },
};
export const STARTER_PROGRAM = {
  name: 'Full body A',
  exercises: [
    ['Back squat', 'Quads'],
    ['Bench press', 'Chest'],
    ['Romanian deadlift', 'Hamstrings'],
    ['Bent-over row', 'Back'],
    ['Overhead press', 'Shoulders'],
    ['Plank', 'Core'],
  ],
};

// ---------- training ----------
export const setsVolume = (sets) => sets.reduce((s, x) => s + (Number(x.reps) || 0) * (Number(x.weightKg) || 0), 0);

const sessionsDesc = (workouts) =>
  Object.keys(workouts)
    .sort()
    .reverse()
    .flatMap((d) => [...workouts[d]].reverse().map((s) => ({ ...s, date: d })));

export function lastPerformance(workouts, name) {
  const key = name.trim().toLowerCase();
  for (const s of sessionsDesc(workouts)) {
    const e = s.entries.find((x) => x.name.trim().toLowerCase() === key);
    if (e) return { date: s.date, sets: e.sets };
  }
  return null;
}

export function bestOf(workouts, name) {
  const key = name.trim().toLowerCase();
  let vol = 0;
  let top = 0;
  for (const s of sessionsDesc(workouts)) {
    for (const e of s.entries) {
      if (e.name.trim().toLowerCase() !== key) continue;
      vol = Math.max(vol, setsVolume(e.sets));
      top = Math.max(top, ...e.sets.map((x) => x.weightKg || 0));
    }
  }
  return { vol, top };
}

export const sessionStats = (s) => ({
  sets: s.entries.reduce((n, e) => n + e.sets.length, 0),
  volume: s.entries.reduce((n, e) => n + setsVolume(e.sets), 0),
  prs: s.entries.filter((e) => e.prs && e.prs.length).length,
});

// ---------- nutrition ----------
export const sumFood = (items) =>
  items.reduce(
    (t, i) => ({
      cal: t.cal + (Number(i.cal) || 0),
      p: t.p + (Number(i.p) || 0),
      c: t.c + (Number(i.c) || 0),
      f: t.f + (Number(i.f) || 0),
      fi: t.fi + (Number(i.fi) || 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0, fi: 0 }
  );

export const STATUS = {
  ok: { color: '#5E7A5E', label: 'On target' },
  warn: { color: '#C99A4B', label: 'Slightly off' },
  bad: { color: '#B5645A', label: 'Off target' },
  pending: { color: '#9DB09B', label: 'In progress' },
};

// mode 'range': aim for target (calories, carbs, fat). mode 'min': aim to reach it (protein, fibre).
export function macroStatus(actual, target, { mode = 'range', isToday = true } = {}) {
  if (!target) return 'pending';
  const r = actual / target;
  if (mode === 'min') {
    if (r >= 0.9) return 'ok';
    if (isToday) return 'pending';
    return r >= 0.75 ? 'warn' : 'bad';
  }
  if (r > 1.2) return 'bad';
  if (r >= 0.9 && r <= 1.1) return 'ok';
  if (r > 1.1) return 'warn';
  if (isToday) return r >= 0.8 ? 'warn' : 'pending';
  return r >= 0.8 ? 'warn' : r >= 0.6 ? 'warn' : 'bad';
}

// ---------- plan: Mifflin-St Jeor ----------
export function suggest(profile, weightKg) {
  const age = Number(profile.age);
  const h = Number(profile.heightCm);
  if (!age || !h || !weightKg) return null;
  const base = 10 * weightKg + 6.25 * h - 5 * age;
  const bmr = profile.sex === 'male' ? base + 5 : base - 161;
  const f = (ACTIVITY.find((a) => a.id === profile.activity) || ACTIVITY[2]).f;
  const tdee = bmr * f;
  const adj = { fatloss: -0.2, muscle: 0.1, maintain: 0, recomp: -0.05 }[profile.goalType] ?? 0;
  const calories = Math.round((tdee * (1 + adj)) / 10) * 10;
  const protein = Math.round(weightKg * (profile.goalType === 'fatloss' ? 2.2 : 2.0));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fibre = Math.max(20, Math.round((calories / 1000) * 14));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, carbs, fat, fibre };
}

// ---------- weight trends ----------
export const sortedWeights = (weights) =>
  Object.entries(weights)
    .map(([date, v]) => ({ date, kg: v.kg, note: v.note || '' }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

export function weeklyTrend(list, today) {
  if (list.length < 2) return null;
  const within = (e, a, b) => e.date > addDays(today, -b) && e.date <= addDays(today, -a);
  const l7 = list.filter((e) => within(e, 0, 7));
  const p7 = list.filter((e) => within(e, 7, 14));
  if (l7.length && p7.length) {
    return { delta: avg(l7.map((e) => e.kg)) - avg(p7.map((e) => e.kg)), method: 'week', twoWeeks: true };
  }
  const recent = list.filter((e) => e.date > addDays(today, -28));
  if (recent.length >= 3) {
    const x0 = recent[0].date;
    const xs = recent.map((e) => daysBetween(x0, e.date));
    const ys = recent.map((e) => e.kg);
    if (xs[xs.length - 1] >= 5) {
      const mx = avg(xs);
      const my = avg(ys);
      const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
      const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
      return { delta: (num / den) * 7, method: 'slope', twoWeeks: false };
    }
  }
  return null;
}

export function etaToGoal(currentKg, goalKg, rate, today) {
  const rem = goalKg - currentKg;
  if (Math.abs(rem) < 0.2) return { state: 'reached' };
  if (!rate || Math.sign(rem) !== Math.sign(rate) || Math.abs(rate) < 0.05) return { state: 'off' };
  const weeks = rem / rate;
  if (weeks > 104) return { state: 'far' };
  return { state: 'ok', weeks, date: addDays(today, Math.round(weeks * 7)) };
}

// ---------- plan: weekly check-in ----------
export function weeklyCheckIn({ settings, food, list, today }) {
  const t = settings.targets;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const totals = days.map((d) => sumFood(food[d] || []));
  const loggedIdx = totals.map((x, i) => (food[days[i]] || []).length > 0 ? i : -1).filter((i) => i >= 0);
  const logged = loggedIdx.length;
  const avgCal = logged ? Math.round(avg(loggedIdx.map((i) => totals[i].cal))) : 0;
  const protHit = totals.filter((x) => t.protein && x.p >= 0.9 * t.protein).length;
  const calHit = loggedIdx.filter((i) => Math.abs(totals[i].cal / t.calories - 1) <= 0.1).length;

  const trend = weeklyTrend(list, today);
  const latest = list[list.length - 1];
  const bw = latest ? latest.kg : null;
  const pct = trend && bw ? (trend.delta / bw) * 100 : null;
  const g = settings.goalType;

  let verdict = 'unknown';
  if (pct !== null) {
    if (g === 'fatloss') verdict = pct < -1 ? 'fast' : pct <= -0.2 ? 'good' : 'stalled';
    else if (g === 'muscle') verdict = pct > 0.5 ? 'fast' : pct >= 0.1 ? 'good' : 'stalled';
    else verdict = Math.abs(pct) <= 0.3 ? 'good' : 'drift';
  }
  const flat2w = !!(trend && trend.twoWeeks && Math.abs(pct) < 0.2);

  const trendText = {
    unknown: 'Log a few more weigh-ins and your trend will show up here.',
    good: 'Weight is trending the right way.',
    fast: g === 'fatloss' ? 'Weight is dropping faster than ideal.' : 'Weight is climbing faster than ideal.',
    stalled: g === 'fatloss' ? 'Weight is not coming down yet.' : 'Weight is not climbing yet.',
    drift: 'Weight is drifting away from where you want it.',
  }[verdict];

  const lines = [];
  if (!logged) lines.push('No food logged in the last 7 days yet. Log a few days and this card compares them to your targets.');
  else {
    lines.push(`You logged ${logged}/7 days and averaged ${fmt(avgCal)} kcal against a ${fmt(t.calories)} target.`);
    lines.push(`You hit protein ${protHit}/7 days.`);
  }
  lines.push(trendText);

  const nudges = [];
  if (flat2w && (g === 'fatloss' || g === 'muscle')) {
    const d = g === 'fatloss' ? -100 : 100;
    nudges.push({
      id: 'flat',
      delta: d,
      title: 'Weight has held steady for 2+ weeks',
      body: `Try ${d < 0 ? 'lowering' : 'raising'} calories by 100 kcal a day and see how the next week goes.`,
    });
  }
  if (g === 'fatloss' && verdict === 'fast') {
    nudges.push({
      id: 'fast',
      delta: 100,
      title: 'Losing more than 1% of bodyweight a week',
      body: 'That pace risks muscle loss. Eat about 100 kcal more per day to slow it down.',
    });
  }
  return { logged, avgCal, protHit, calHit, trend, verdict, lines, nudges, pct };
}
