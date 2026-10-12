import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Minus, Flag, Trophy } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Button, Card, Chip, Field, IconButton, NumInput, PRBadge, Select, Sheet, TextInput, cx } from './ui.jsx';
import { RestRing } from './charts.jsx';
import {
  MUSCLES, REST_OPTIONS, bestOf, fmtClock, fromDisplay, isoDate, lastPerformance, round, setsVolume, toDisplay, uid, fmt,
} from '../utils.js';

const setInput =
  'h-11 !px-1 !rounded-xl text-center text-[15px]';

export function newSets(workouts, name, unit) {
  const last = lastPerformance(workouts, name);
  const src = last ? last.sets : [{}, {}, {}];
  return src.map((s) => ({
    id: uid(),
    weight: s.weightKg != null ? round(toDisplay(s.weightKg, unit), 2) : '',
    reps: s.reps ?? '',
    done: false,
  }));
}

export default function ActiveWorkout() {
  const { active, setActive, workouts, setWorkouts, settings, setSettings, toast, setWorkoutOpen } = useApp();
  const [now, setNow] = useState(Date.now());
  const [finishing, setFinishing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [date, setDate] = useState(isoDate());
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('Chest');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const unit = active.unit;
  const elapsed = Math.floor((now - active.startedAt) / 1000);
  const resting = !!active.restEnd;
  const restMs = resting ? Math.max(0, active.restEnd - now) : 0;
  const restLeft = Math.ceil(restMs / 1000);

  // Rest finished: clear it, nudge the user.
  useEffect(() => {
    if (active.restEnd && now >= active.restEnd) {
      setActive((a) => (a && a.restEnd ? { ...a, restEnd: null } : a));
      toast('Rest over. Next set.');
      if (navigator.vibrate) navigator.vibrate(180);
    }
  }, [now, active.restEnd, setActive, toast]);

  const names = active.entries.map((e) => e.name).join('|');
  const lasts = useMemo(
    () => Object.fromEntries(active.entries.map((e) => [e.id, lastPerformance(workouts, e.name)])),
    [names, workouts] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const bests = useMemo(
    () => Object.fromEntries(active.entries.map((e) => [e.id, bestOf(workouts, e.name)])),
    [names, workouts] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toKgSets = (e) =>
    e.sets.filter((s) => s.done).map((s) => ({
      reps: Number(s.reps) || 0,
      weightKg: round(fromDisplay(Number(s.weight) || 0, unit), 2),
    }));

  const prsFor = (e) => {
    const sets = toKgSets(e);
    const b = bests[e.id] || { vol: 0, top: 0 };
    if (!sets.length) return [];
    const out = [];
    if (b.vol > 0 && setsVolume(sets) > b.vol + 0.001) out.push('volume');
    if (b.top > 0 && Math.max(...sets.map((s) => s.weightKg)) > b.top + 0.001) out.push('weight');
    return out;
  };

  const updateSet = (ei, si, patch, extra = {}) =>
    setActive((a) => ({
      ...a,
      ...extra,
      entries: a.entries.map((e, i) =>
        i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) }
      ),
    }));

  const toggleDone = (ei, si) => {
    const s = active.entries[ei].sets[si];
    if (s.done) return updateSet(ei, si, { done: false });
    if (!(Number(s.reps) > 0)) return toast('Add the reps to complete this set', 'warn');
    const sec = settings.restSec;
    updateSet(ei, si, { done: true }, { restEnd: Date.now() + sec * 1000, restTotal: sec });
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const addSet = (ei) =>
    setActive((a) => ({
      ...a,
      entries: a.entries.map((e, i) => {
        if (i !== ei) return e;
        const prev = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { id: uid(), weight: prev ? prev.weight : '', reps: prev ? prev.reps : '', done: false }] };
      }),
    }));

  const removeSet = (ei) =>
    setActive((a) => ({
      ...a,
      entries: a.entries.map((e, i) => (i !== ei || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) })),
    }));

  const adjustRest = (secs) => setActive((a) => ({ ...a, restEnd: a.restEnd + secs * 1000, restTotal: a.restTotal + secs }));
  const skipRest = () => setActive((a) => ({ ...a, restEnd: null }));

  const addExercise = () => {
    const name = newName.trim();
    if (!name) return toast('Name the exercise first', 'warn');
    setActive((a) => ({
      ...a,
      entries: [...a.entries, { id: uid(), exerciseId: uid(), name, muscle: newMuscle, sets: newSets(workouts, name, unit) }],
    }));
    setNewName('');
    setAdding(false);
    toast(`${name} added`);
  };

  const doneSets = active.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.entries.reduce((n, e) => n + e.sets.length, 0);
  const volumeKg = active.entries.reduce((n, e) => n + setsVolume(toKgSets(e)), 0);
  const prCount = active.entries.filter((e) => prsFor(e).length).length;

  const save = () => {
    const entries = active.entries
      .map((e) => {
        const sets = toKgSets(e);
        return sets.length ? { name: e.name, muscle: e.muscle, sets, prs: prsFor(e) } : null;
      })
      .filter(Boolean);
    const session = {
      id: active.id,
      programId: active.programId,
      programName: active.programName,
      startedAt: active.startedAt,
      durationSec: elapsed,
      entries,
    };
    setWorkouts((w) => ({ ...w, [date]: [...(w[date] || []), session] }));
    setActive(null);
    setWorkoutOpen(false);
    toast(prCount ? `Workout saved. ${prCount} new PR${prCount > 1 ? 's' : ''}!` : 'Workout saved', 'pr');
  };

  const discardNow = () => {
    setActive(null);
    setWorkoutOpen(false);
    toast('Workout discarded');
  };

  return (
    <div className="fixed inset-0 z-40 bg-cream flex flex-col animate-fade">
      {/* header */}
      <div className="max-w-xl w-full mx-auto px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex items-center gap-2">
        <IconButton label="Minimise workout" onClick={() => setWorkoutOpen(false)}>
          <ChevronDown size={24} />
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg leading-tight truncate">{active.programName}</p>
          <p className="text-sm text-charcoal/50">
            {doneSets}/{totalSets} sets done
          </p>
        </div>
        <span className="font-mono text-2xl tabular-nums text-sage-dark">{fmtClock(elapsed)}</span>
      </div>

      {/* exercises */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 pb-6 space-y-3">
          {active.entries.map((e, ei) => {
            const last = lasts[e.id];
            const prs = prsFor(e);
            return (
              <Card key={e.id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-[17px] leading-tight">{e.name}</h3>
                    <p className="text-[13px] text-charcoal/50 mt-0.5">
                      {e.muscle}
                      {last && (
                        <span className="font-mono">
                          {' '}
                          · last {last.sets.map((s) => `${round(toDisplay(s.weightKg, unit), 1)}×${s.reps}`).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                  {prs.length > 0 && <PRBadge label={prs.includes('volume') ? 'New PR' : 'Heaviest set'} />}
                </div>

                <div className="mt-3 grid grid-cols-[26px_1fr_68px_60px_44px] items-center gap-2 px-1 text-xs font-bold text-charcoal/40">
                  <span className="text-center">Set</span>
                  <span>Last</span>
                  <span className="text-center">{unit}</span>
                  <span className="text-center">Reps</span>
                  <span />
                </div>
                <div className="mt-1 space-y-1">
                  {e.sets.map((s, si) => {
                    const prev = last?.sets[si];
                    return (
                      <div
                        key={s.id}
                        className={cx(
                          'grid grid-cols-[26px_1fr_68px_60px_44px] items-center gap-2 py-1 px-1 rounded-2xl transition-colors',
                          s.done && 'bg-sage-light/70'
                        )}
                      >
                        <span className="text-center text-sm font-mono text-charcoal/50">{si + 1}</span>
                        <span className="text-[13px] font-mono text-charcoal/45 truncate">
                          {prev ? `${round(toDisplay(prev.weightKg, unit), 1)}×${prev.reps}` : '-'}
                        </span>
                        <NumInput
                          className={setInput}
                          value={s.weight}
                          placeholder="0"
                          aria-label={`Set ${si + 1} weight`}
                          onChange={(v) => updateSet(ei, si, { weight: v })}
                        />
                        <NumInput
                          decimal={false}
                          className={setInput}
                          value={s.reps}
                          placeholder="0"
                          aria-label={`Set ${si + 1} reps`}
                          onChange={(v) => updateSet(ei, si, { reps: v })}
                        />
                        <button
                          onClick={() => toggleDone(ei, si)}
                          aria-label={s.done ? `Undo set ${si + 1}` : `Complete set ${si + 1}`}
                          aria-pressed={s.done}
                          className={cx(
                            'h-11 w-11 rounded-full grid place-items-center transition active:scale-90',
                            s.done ? 'bg-sage text-cream animate-pop' : 'bg-sand-dark/70 text-charcoal/30'
                          )}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L19 7" strokeDasharray="24" strokeDashoffset={s.done ? undefined : 0} className={s.done ? 'animate-draw' : ''} />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex gap-2">
                  <Button variant="soft" size="sm" className="flex-1" onClick={() => addSet(ei)}>
                    <Plus size={16} /> Add set
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeSet(ei)} aria-label="Remove last set">
                    <Minus size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* bottom dock: rest timer + actions, in thumb reach */}
      <div className="bg-cream border-t border-sand-dark/70 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="max-w-xl mx-auto px-4 pt-3 space-y-3">
          {resting ? (
            <div className="flex items-center gap-4 bg-sand rounded-3xl p-3 pr-4">
              <RestRing fraction={restMs / 1000 / Math.max(1, active.restTotal)} seconds={restLeft} size={104} />
              <div className="flex-1">
                <p className="font-black text-lg leading-tight">Rest</p>
                <p className="text-sm text-charcoal/55">Breathe. Next set when the ring closes.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="soft" size="sm" onClick={() => adjustRest(15)}>+15s</Button>
                  <Button variant="dark" size="sm" onClick={skipRest}>Skip</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-charcoal/55 pr-1">Rest</span>
              <div className="flex gap-1.5 flex-1">
                {REST_OPTIONS.map((s) => (
                  <Chip
                    key={s}
                    active={settings.restSec === s}
                    className="flex-1 !h-10 !px-0 font-mono"
                    onClick={() => setSettings((x) => ({ ...x, restSec: s }))}
                  >
                    {s}s
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="soft" size="lg" className="flex-1" onClick={() => setAdding(true)}>
              <Plus size={18} /> Exercise
            </Button>
            <Button size="lg" className="flex-[1.4]" onClick={() => { setDiscard(false); setFinishing(true); }}>
              <Flag size={18} /> Finish
            </Button>
          </div>
        </div>
      </div>

      {adding && (
        <Sheet
          title="Add an exercise"
          onClose={() => setAdding(false)}
          footer={<Button size="lg" className="w-full" onClick={addExercise}>Add to workout</Button>}
        >
          <Field label="Exercise name">
            <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Hip thrust" autoFocus />
          </Field>
          <Field label="Muscle group">
            <Select value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)}>
              {MUSCLES.map((m) => <option key={m}>{m}</option>)}
            </Select>
          </Field>
        </Sheet>
      )}

      {finishing && (
        <Sheet
          title={doneSets ? 'Nice work. Save it?' : 'Nothing logged yet'}
          onClose={() => setFinishing(false)}
          footer={
            <>
              {doneSets > 0 && <Button size="lg" className="w-full" onClick={save}>Save workout</Button>}
              <Button variant="ghost" className="w-full" onClick={() => setFinishing(false)}>Keep training</Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => (discard ? discardNow() : setDiscard(true))}
              >
                {discard ? 'Tap again to discard' : 'Discard workout'}
              </Button>
            </>
          }
        >
          {doneSets > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Time', fmtClock(elapsed)],
                  ['Sets', `${doneSets}`],
                  ['Volume', `${fmt(toDisplay(volumeKg, unit))}${unit}`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-sand rounded-2xl py-3">
                    <p className="font-mono text-lg text-sage-dark">{v}</p>
                    <p className="text-xs text-charcoal/50 font-bold">{k}</p>
                  </div>
                ))}
              </div>
              {prCount > 0 && (
                <div className="flex items-center gap-2 bg-warn/15 text-[#8A6420] rounded-2xl px-4 py-3 font-bold text-sm">
                  <Trophy size={18} /> {prCount} new personal record{prCount > 1 ? 's' : ''} this session
                </div>
              )}
              <Field label="Session date">
                <TextInput type="date" max={isoDate()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </Field>
            </>
          ) : (
            <p className="text-[15px] text-charcoal/60">
              Tick off at least one set to save this session, or keep training.
            </p>
          )}
        </Sheet>
      )}
    </div>
  );
}
