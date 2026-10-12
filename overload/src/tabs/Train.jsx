import { useMemo, useState } from 'react';
import { Dumbbell, Plus, Pencil, Play, ChevronLeft, ChevronRight, ChevronDown, Trash2, Sparkles, Trash } from 'lucide-react';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../store.jsx';
import { Button, Card, EmptyState, Field, IconButton, PageTitle, PRBadge, Select, Sheet, TextInput, cx } from '../components/ui.jsx';
import { newSets } from '../components/ActiveWorkout.jsx';
import {
  MUSCLES, STARTER_PROGRAM, addDays, fmt, fmtClock, isoDate, longDate, round, sessionStats, setsVolume, shortDate, startOfWeek, toDisplay, uid,
} from '../utils.js';

function ProgramEditor({ program, onClose }) {
  const { programs, setPrograms, toast } = useApp();
  const isNew = !program.id;
  const [name, setName] = useState(program.name || '');
  const [exs, setExs] = useState(program.exercises?.length ? program.exercises : [{ id: uid(), name: '', muscle: 'Chest' }]);
  const [confirmDel, setConfirmDel] = useState(false);

  const patch = (i, p) => setExs((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const save = () => {
    const clean = exs.filter((x) => x.name.trim()).map((x) => ({ ...x, name: x.name.trim() }));
    if (!name.trim()) return toast('Give the program a name', 'warn');
    if (!clean.length) return toast('Add at least one exercise', 'warn');
    const prog = { id: program.id || uid(), name: name.trim(), exercises: clean };
    setPrograms((p) => (isNew ? [...p, prog] : p.map((x) => (x.id === prog.id ? prog : x))));
    toast(isNew ? 'Program created' : 'Program updated');
    onClose();
  };

  const del = () => {
    setPrograms((p) => p.filter((x) => x.id !== program.id));
    toast('Program deleted');
    onClose();
  };

  return (
    <Sheet
      title={isNew ? 'New program' : 'Edit program'}
      onClose={onClose}
      footer={
        <>
          <Button size="lg" className="w-full" onClick={save}>Save program</Button>
          {!isNew && (
            <Button variant="danger" className="w-full" onClick={() => (confirmDel ? del() : setConfirmDel(true))}>
              {confirmDel ? 'Tap again to delete' : 'Delete program'}
            </Button>
          )}
        </>
      }
    >
      <Field label="Program name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lower body, Push day" autoFocus={isNew} />
      </Field>
      <div className="space-y-2">
        <p className="text-[13px] font-bold text-charcoal/70 px-1">Exercises</p>
        {exs.map((x, i) => (
          <div key={x.id} className="flex gap-2 items-center">
            <TextInput className="flex-1 min-w-0" value={x.name} placeholder="Exercise" onChange={(e) => patch(i, { name: e.target.value })} />
            <Select className="!w-[118px] !px-3 text-sm" value={x.muscle} onChange={(e) => patch(i, { muscle: e.target.value })} aria-label="Muscle group">
              {MUSCLES.map((m) => <option key={m}>{m}</option>)}
            </Select>
            <IconButton label="Remove exercise" onClick={() => setExs((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : l))}>
              <Trash2 size={18} />
            </IconButton>
          </div>
        ))}
        <Button variant="soft" className="w-full" onClick={() => setExs((l) => [...l, { id: uid(), name: '', muscle: l[l.length - 1]?.muscle || 'Chest' }])}>
          <Plus size={18} /> Add exercise
        </Button>
      </div>
    </Sheet>
  );
}

function HistoryItem({ s, unit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const st = sessionStats(s);
  return (
    <div className="bg-sand rounded-3xl overflow-hidden">
      <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="flex-1 min-w-0">
          <p className="font-black leading-tight truncate">{s.programName}</p>
          <p className="text-[13px] text-charcoal/55 mt-0.5">
            {longDate(s.date)}
          </p>
          <p className="text-[13px] font-mono text-charcoal/50 mt-1">
            {fmtClock(s.durationSec)} · {st.sets} sets · {fmt(toDisplay(st.volume, unit))}{unit}
          </p>
        </div>
        {st.prs > 0 && <PRBadge label={`${st.prs} PR`} />}
        <ChevronDown size={20} className={cx('text-charcoal/40 transition-transform', open && 'rotate-180')} />
      </button>
      <div className={cx('grid transition-[grid-template-rows] duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4 space-y-3">
            {s.entries.map((e, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[15px]">{e.name}</p>
                  {e.prs?.length > 0 && <PRBadge />}
                </div>
                <p className="text-[13px] font-mono text-charcoal/60 mt-0.5 leading-relaxed">
                  {e.sets.map((x) => `${round(toDisplay(x.weightKg, unit), 1)}${unit} × ${x.reps}`).join('   ')}
                </p>
              </div>
            ))}
            <Button
              variant="danger"
              size="sm"
              onClick={() => (confirm ? onDelete() : setConfirm(true))}
            >
              <Trash size={15} /> {confirm ? 'Tap again to delete' : 'Delete session'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Train() {
  const { programs, setPrograms, workouts, setWorkouts, active, setActive, setWorkoutOpen, settings, toast } = useApp();
  const unit = settings.unit;
  const [editing, setEditing] = useState(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(isoDate()));
  const [shown, setShown] = useState(8);

  const startWorkout = (prog) => {
    if (active) {
      setWorkoutOpen(true);
      return toast('Finish or discard your current workout first', 'warn');
    }
    setActive({
      id: uid(),
      programId: prog.id,
      programName: prog.name,
      startedAt: Date.now(),
      unit,
      restEnd: null,
      restTotal: 0,
      entries: prog.exercises.map((ex) => ({
        id: uid(), exerciseId: ex.id, name: ex.name, muscle: ex.muscle, sets: newSets(workouts, ex.name, unit),
      })),
    });
    setWorkoutOpen(true);
  };

  const addStarter = () => {
    setPrograms((p) => [
      ...p,
      { id: uid(), name: STARTER_PROGRAM.name, exercises: STARTER_PROGRAM.exercises.map(([name, muscle]) => ({ id: uid(), name, muscle })) },
    ]);
    toast('Starter program added');
  };

  const weekEnd = addDays(weekStart, 6);
  const thisWeek = startOfWeek(isoDate());
  const chart = useMemo(() => {
    const m = {};
    for (const [d, list] of Object.entries(workouts)) {
      if (d < weekStart || d > weekEnd) continue;
      for (const s of list) for (const e of s.entries) m[e.muscle] = (m[e.muscle] || 0) + setsVolume(e.sets);
    }
    return Object.entries(m)
      .map(([muscle, v]) => ({ muscle, vol: Math.round(toDisplay(v, unit)) }))
      .filter((x) => x.vol > 0)
      .sort((a, b) => b.vol - a.vol);
  }, [workouts, weekStart, weekEnd, unit]);

  const history = useMemo(
    () =>
      Object.entries(workouts)
        .flatMap(([date, list]) => list.map((s) => ({ ...s, date })))
        .sort((a, b) => (a.date === b.date ? b.startedAt - a.startedAt : a.date < b.date ? 1 : -1)),
    [workouts]
  );

  const deleteSession = (s) => {
    setWorkouts((w) => {
      const next = { ...w, [s.date]: (w[s.date] || []).filter((x) => x.id !== s.id) };
      if (!next[s.date].length) delete next[s.date];
      return next;
    });
    toast('Session deleted');
  };

  return (
    <div className="space-y-5">
      <PageTitle title="Train" sub={programs.length ? 'Pick a session and beat last time.' : 'Build a program, then log every set.'} />

      {active && (
        <Card className="!bg-sage-dark text-cream flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-black truncate">{active.programName}</p>
            <p className="text-sm text-cream/70">Workout in progress</p>
          </div>
          <Button variant="soft" onClick={() => setWorkoutOpen(true)}>Resume</Button>
        </Card>
      )}

      {programs.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Your first session starts here" body="Create a program with the exercises you do, and Overload shows what you lifted last time so you can beat it.">
          <Button size="lg" onClick={() => setEditing({})}><Plus size={18} /> Build a program</Button>
          <Button size="lg" variant="soft" onClick={addStarter}><Sparkles size={18} /> Use a starter</Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <Card key={p.id} className="!p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0 pl-1">
                <h3 className="font-black text-lg leading-tight truncate">{p.name}</h3>
                <p className="text-[13px] text-charcoal/55 mt-0.5 truncate">
                  {p.exercises.length} exercises · {p.exercises.slice(0, 3).map((e) => e.name).join(', ')}
                  {p.exercises.length > 3 ? '…' : ''}
                </p>
              </div>
              <IconButton label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil size={18} /></IconButton>
              <Button size="md" onClick={() => startWorkout(p)}><Play size={16} fill="currentColor" /> Start</Button>
            </Card>
          ))}
          <Button variant="soft" className="w-full" onClick={() => setEditing({})}><Plus size={18} /> New program</Button>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-lg">Weekly volume</h3>
          <div className="flex items-center">
            <IconButton label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={20} /></IconButton>
            <IconButton label="Next week" disabled={weekStart >= thisWeek} className="disabled:opacity-30" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={20} /></IconButton>
          </div>
        </div>
        <p className="text-[13px] text-charcoal/55 mb-3 font-mono">
          {weekStart === thisWeek ? 'This week' : `${shortDate(weekStart)} to ${shortDate(weekEnd)}`} · {unit} lifted per muscle group
        </p>
        {chart.length === 0 ? (
          <p className="text-[15px] text-charcoal/55 py-6 text-center">
            No volume logged this week. Finish a workout and your muscle groups fill in here.
          </p>
        ) : (
          <div style={{ height: chart.length * 40 + 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="muscle" width={84} axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#2A2A2A', fontWeight: 500 }} />
                <Tooltip cursor={{ fill: 'rgba(94,122,94,.08)' }} contentStyle={{ borderRadius: 14, border: 'none', background: '#FAF8F4', fontSize: 13 }} formatter={(v) => [`${fmt(v)} ${unit}`, 'Volume']} />
                <Bar dataKey="vol" fill="#5E7A5E" radius={[4, 10, 10, 4]} barSize={22} isAnimationActive>
                  <LabelList dataKey="vol" position="right" style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, fill: '#3D5A3D' }} formatter={(v) => fmt(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="font-black text-lg px-1">History</h3>
        {history.length === 0 ? (
          <p className="text-[15px] text-charcoal/55 px-1">
            Finished workouts land here with every set, plus PR badges when you beat your best.
          </p>
        ) : (
          <>
            {history.slice(0, shown).map((s) => (
              <HistoryItem key={s.id} s={s} unit={unit} onDelete={() => deleteSession(s)} />
            ))}
            {history.length > shown && (
              <Button variant="soft" className="w-full" onClick={() => setShown((n) => n + 8)}>Show more</Button>
            )}
          </>
        )}
      </div>

      {editing && <ProgramEditor program={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
