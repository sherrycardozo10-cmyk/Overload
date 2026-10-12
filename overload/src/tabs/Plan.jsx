import { useRef, useState } from 'react';
import { Download, Upload, Sparkles, Scale, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Button, Card, Chip, Field, NumInput, PageTitle, Select, Seg, TextInput, cx } from '../components/ui.jsx';
import { ACTIVITY, GOALS, REST_OPTIONS, fmt, fromDisplay, isoDate, longDate, round, sortedWeights, suggest, toDisplay, weeklyCheckIn } from '../utils.js';

export default function Plan() {
  const { settings, setSettings, weights, food, toast, setTab, exportAll, importAll, resetAll } = useApp();
  const unit = settings.unit;
  const today = isoDate();
  const fileRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const list = sortedWeights(weights);
  const latest = list[list.length - 1];
  const sug = suggest(settings, latest?.kg);
  const t = settings.targets;
  const check = weeklyCheckIn({ settings, food, list, today });

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const setT = (patch) => setSettings((s) => ({ ...s, targets: { ...s.targets, ...patch } }));

  const missing = [];
  if (!latest) missing.push('a weigh-in');
  if (!Number(settings.age)) missing.push('age');
  if (!Number(settings.heightCm)) missing.push('height');

  const applySuggestion = () => {
    setT({ calories: sug.calories, protein: sug.protein, carbs: sug.carbs, fat: sug.fat, fibre: sug.fibre });
    toast('Targets updated');
  };

  const applyNudge = (n) => {
    setT({ calories: Math.max(1000, t.calories + n.delta), carbs: Math.max(0, t.carbs + Math.round(n.delta / 4)) });
    toast(`Calories ${n.delta > 0 ? 'raised' : 'lowered'} by 100 kcal`);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `overload-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      importAll(JSON.parse(await file.text()));
      toast('Backup restored');
    } catch (err) {
      toast(err.message || 'Could not read that file', 'warn');
    }
  };

  const targetFields = [
    { k: 'calories', label: 'Calories', unit: 'kcal' },
    { k: 'protein', label: 'Protein', unit: 'g' },
    { k: 'carbs', label: 'Carbs', unit: 'g' },
    { k: 'fat', label: 'Fat', unit: 'g' },
    { k: 'fibre', label: 'Fibre', unit: 'g' },
  ];

  const toneBar = { good: 'bg-sage', fast: 'bg-warn', stalled: 'bg-warn', drift: 'bg-warn', unknown: 'bg-sand-dark' }[check.verdict];

  return (
    <div className="space-y-5">
      <PageTitle title={settings.name ? `Plan, ${settings.name}` : 'Plan'} sub="Set your goal and let your own data steer the targets." />

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className={cx('h-8 w-1.5 rounded-full', toneBar)} />
          <h3 className="font-black text-lg">Weekly check-in</h3>
        </div>
        <div className="space-y-2">
          {check.lines.map((l, i) => (
            <p key={i} className={cx('leading-snug', i === 0 ? 'text-[16px] font-bold' : 'text-[15px] text-charcoal/70')}>{l}</p>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-cream rounded-2xl py-3">
            <p className="font-mono text-lg">{check.protHit}/7</p>
            <p className="text-xs font-bold text-charcoal/50">Protein days</p>
          </div>
          <div className="bg-cream rounded-2xl py-3">
            <p className="font-mono text-lg">{check.logged ? fmt(check.avgCal) : '-'}</p>
            <p className="text-xs font-bold text-charcoal/50">Avg kcal</p>
          </div>
          <div className="bg-cream rounded-2xl py-3">
            <p className="font-mono text-lg">
              {check.trend ? `${check.trend.delta > 0 ? '+' : '\u2212'}${Math.abs(round(toDisplay(check.trend.delta, unit), 1))}` : '-'}
            </p>
            <p className="text-xs font-bold text-charcoal/50">{unit} / week</p>
          </div>
        </div>
        {check.nudges.map((n) => (
          <div key={n.id} className="mt-3 bg-warn/15 rounded-2xl p-4">
            <p className="font-black text-[15px] text-[#7A5A1E]">{n.title}</p>
            <p className="text-[14px] text-charcoal/70 mt-1 leading-snug">{n.body}</p>
            <Button size="sm" className="mt-3" onClick={() => applyNudge(n)}>
              {n.delta > 0 ? 'Add 100 kcal' : 'Cut 100 kcal'} to my target
            </Button>
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <h3 className="font-black text-lg">About you</h3>
        <Field label="Name">
          <TextInput value={settings.name} onChange={(e) => set({ name: e.target.value })} placeholder="What should we call you?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age" hint="years"><NumInput decimal={false} value={settings.age} onChange={(v) => set({ age: v })} placeholder="30" /></Field>
          <Field label="Height" hint="cm"><NumInput value={settings.heightCm} onChange={(v) => set({ heightCm: v })} placeholder="168" /></Field>
        </div>
        <Field label="Sex (for the calorie formula)">
          <Seg className="w-full [&>button]:flex-1" value={settings.sex} onChange={(v) => set({ sex: v })} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
        </Field>
        <Field label="Activity level">
          <Select value={settings.activity} onChange={(e) => set({ activity: e.target.value })}>
            {ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
        </Field>
        <div>
          <p className="text-[13px] font-bold text-charcoal/70 mb-1.5 px-1">Goal</p>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <Chip key={g.id} active={settings.goalType === g.id} onClick={() => set({ goalType: g.id })}>{g.label}</Chip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current weight" hint={unit}>
            <div className="h-12 rounded-2xl bg-sand-dark/40 px-4 flex items-center font-mono text-[15px] text-charcoal/70">
              {latest ? round(toDisplay(latest.kg, unit), 1) : '-'}
            </div>
          </Field>
          <Field label="Goal weight" hint={unit}>
            <NumInput
              value={settings.goalWeightKg ? round(toDisplay(settings.goalWeightKg, unit), 2) : ''}
              onChange={(v) => set({ goalWeightKg: v === '' ? '' : fromDisplay(v, unit) })}
              placeholder={unit === 'kg' ? '60' : '132'}
            />
          </Field>
        </div>
        {!latest && (
          <Button variant="soft" className="w-full" onClick={() => setTab('weigh')}>
            <Scale size={18} /> Log your first weigh-in <ArrowRight size={16} />
          </Button>
        )}
        <p className="text-xs text-charcoal/45 px-1">Current weight comes from your latest weigh-in.</p>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-black text-lg">Your numbers</h3>
        {sug ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-cream rounded-2xl py-3">
                <p className="font-mono text-xl">{fmt(sug.bmr)}</p>
                <p className="text-xs font-bold text-charcoal/50">BMR, kcal</p>
              </div>
              <div className="bg-cream rounded-2xl py-3">
                <p className="font-mono text-xl">{fmt(sug.tdee)}</p>
                <p className="text-xs font-bold text-charcoal/50">TDEE, kcal</p>
              </div>
            </div>
            <div className="bg-sage-light rounded-2xl p-4">
              <p className="font-bold text-sage-dark flex items-center gap-2"><Sparkles size={17} /> Suggested for {GOALS.find((g) => g.id === settings.goalType).label.toLowerCase()}</p>
              <p className="font-mono text-[15px] text-sage-dark mt-2 leading-relaxed">
                {fmt(sug.calories)} kcal · P {sug.protein}g · C {sug.carbs}g · F {sug.fat}g · Fi {sug.fibre}g
              </p>
              <Button className="mt-3 w-full" onClick={applySuggestion}><Check size={18} /> Use these targets</Button>
            </div>
          </>
        ) : (
          <p className="text-[15px] text-charcoal/65 leading-snug">
            Add {missing.join(', ').replace(/, ([^,]*)$/, ' and $1')} to calculate your maintenance calories and get a suggested split.
          </p>
        )}

        <p className="text-[13px] font-bold text-charcoal/70 px-1 pt-1">Daily targets (edit any value)</p>
        <div className="grid grid-cols-2 gap-3">
          {targetFields.map((f) => (
            <Field key={f.k} label={f.label} hint={sug && sug[f.k] !== t[f.k] ? `suggest ${sug[f.k]}` : f.unit}>
              <NumInput decimal={false} value={t[f.k]} onChange={(v) => setT({ [f.k]: v === '' ? 0 : v })} />
            </Field>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-black text-lg">Settings</h3>
        <Field label="Weight unit">
          <Seg value={settings.unit} onChange={(v) => set({ unit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]} />
        </Field>
        <Field label="Default rest timer">
          <div className="grid grid-cols-4 gap-2">
            {REST_OPTIONS.map((s) => (
              <Chip key={s} active={settings.restSec === s} className="font-mono !px-0" onClick={() => set({ restSec: s })}>{s}s</Chip>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={download}><Download size={18} /> Back up</Button>
          <Button variant="soft" onClick={() => fileRef.current?.click()}><Upload size={18} /> Restore</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={upload} />
        </div>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            resetAll();
            setConfirmReset(false);
            toast('All data erased');
          }}
        >
          {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
        </Button>
        <p className="text-xs text-charcoal/45 px-1">Everything lives on this device only. Back up before clearing your browser data.</p>
      </Card>
    </div>
  );
}
