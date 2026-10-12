import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Heart, Utensils, X } from 'lucide-react';
import { useApp } from '../store.jsx';
import { Button, Card, EmptyState, Fab, Field, IconButton, NumInput, PageTitle, Sheet, TextInput, cx } from '../components/ui.jsx';
import { Rings } from '../components/charts.jsx';
import { STATUS, addDays, dayLabel, fmt, isoDate, macroStatus, sumFood, uid } from '../utils.js';

const MACROS = [
  { key: 'p', tkey: 'protein', label: 'Protein', color: '#5E7A5E', mode: 'min' },
  { key: 'c', tkey: 'carbs', label: 'Carbs', color: '#B9A27C', mode: 'range' },
  { key: 'f', tkey: 'fat', label: 'Fat', color: '#D8C7A8', mode: 'range' },
  { key: 'fi', tkey: 'fibre', label: 'Fibre', color: '#8FA88F', mode: 'min' },
];

const EMPTY = { name: '', cal: '', p: '', c: '', f: '', fi: '' };

function AddFood({ onClose, onAdd, onFav }) {
  const { toast } = useApp();
  const [f, setF] = useState(EMPTY);
  const [fav, setFav] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    if (!f.name.trim()) return toast('Name the food first', 'warn');
    const n = (v) => Number(v) || 0;
    let cal = n(f.cal);
    if (!cal) cal = Math.round(n(f.p) * 4 + n(f.c) * 4 + n(f.f) * 9);
    if (!cal && !n(f.p) && !n(f.c) && !n(f.f)) return toast('Add calories or macros', 'warn');
    const item = { name: f.name.trim(), cal, p: n(f.p), c: n(f.c), f: n(f.f), fi: n(f.fi) };
    onAdd(item);
    if (fav) onFav(item);
    onClose();
  };

  return (
    <Sheet title="Log food" onClose={onClose} footer={<Button size="lg" className="w-full" onClick={save}>Add to log</Button>}>
      <Field label="Food">
        <TextInput value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Greek yogurt and berries" autoFocus />
      </Field>
      <Field label="Calories" hint="kcal">
        <NumInput decimal={false} value={f.cal} onChange={set('cal')} placeholder="Leave blank to calculate from macros" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Protein" hint="g"><NumInput value={f.p} onChange={set('p')} placeholder="0" /></Field>
        <Field label="Carbs" hint="g"><NumInput value={f.c} onChange={set('c')} placeholder="0" /></Field>
        <Field label="Fat" hint="g"><NumInput value={f.f} onChange={set('f')} placeholder="0" /></Field>
        <Field label="Fibre" hint="g"><NumInput value={f.fi} onChange={set('fi')} placeholder="0" /></Field>
      </div>
      <button
        type="button"
        onClick={() => setFav((v) => !v)}
        className={cx('w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold transition', fav ? 'bg-sage-light text-sage-dark' : 'bg-sand text-charcoal/60')}
        aria-pressed={fav}
      >
        <Heart size={18} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Saved to favourites' : 'Save to favourites'}
      </button>
    </Sheet>
  );
}

export default function Eat() {
  const { settings, food, setFood, favs, setFavs, toast } = useApp();
  const today = isoDate();
  const [date, setDate] = useState(today);
  const [adding, setAdding] = useState(false);
  const isToday = date === today;
  const items = food[date] || [];
  const t = settings.targets;
  const tot = sumFood(items);

  const addItem = (item, silent) => {
    setFood((f) => ({ ...f, [date]: [...(f[date] || []), { id: uid(), ...item }] }));
    if (!silent) toast(`${item.name} logged`);
  };
  const removeItem = (id) => {
    setFood((f) => ({ ...f, [date]: (f[date] || []).filter((x) => x.id !== id) }));
    toast('Entry removed');
  };
  const saveFav = (item) => {
    if (favs.some((x) => x.name.toLowerCase() === item.name.toLowerCase())) return toast('Already in favourites');
    setFavs((l) => [...l, { id: uid(), name: item.name, cal: item.cal, p: item.p, c: item.c, f: item.f, fi: item.fi }]);
    toast(`${item.name} saved to favourites`);
  };
  const isFav = (name) => favs.some((x) => x.name.toLowerCase() === name.toLowerCase());

  const calSt = macroStatus(tot.cal, t.calories, { mode: 'range', isToday });
  const stats = MACROS.map((m) => {
    const actual = tot[m.key];
    const target = t[m.tkey];
    const st = macroStatus(actual, target, { mode: m.mode, isToday });
    return { ...m, actual, target, st, ratio: target ? actual / target : 0 };
  });
  const left = t.calories - tot.cal;
  const protLeft = Math.max(0, t.protein - tot.p);
  const hit = stats.filter((s) => s.st === 'ok').map((s) => s.label.toLowerCase());
  const off = stats.filter((s) => s.st === 'bad' || (s.st === 'warn' && s.ratio > 1)).map((s) => s.label.toLowerCase());
  const onTargetCount = hit.length + (calSt === 'ok' ? 1 : 0);

  const ringColor = (st, ratio, base) => ((st === 'bad' || st === 'warn') && ratio > 1 ? STATUS[st].color : base);
  const rings = [
    { r: 100, pct: t.calories ? tot.cal / t.calories : 0, color: ringColor(calSt, t.calories ? tot.cal / t.calories : 0, '#3D5A3D') },
    ...['p', 'c', 'f'].map((k, i) => {
      const s = stats.find((x) => x.key === k);
      return { r: 81 - i * 19, pct: s.ratio, color: ringColor(s.st, s.ratio, s.color) };
    }),
  ];

  return (
    <div className="space-y-5">
      <PageTitle title="Eat" sub="Log what you eat and watch the rings fill." />

      <div className="flex items-center justify-between bg-sand rounded-2xl p-1.5">
        <IconButton label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={22} /></IconButton>
        <button onClick={() => setDate(today)} className="font-black text-[17px] px-4 h-10" aria-label="Jump to today">
          {dayLabel(date)}
        </button>
        <IconButton label="Next day" disabled={isToday} className="disabled:opacity-30" onClick={() => setDate(addDays(date, 1))}><ChevronRight size={22} /></IconButton>
      </div>

      <Card className="!pt-6">
        <Rings rings={rings}>
          <div>
            <p className="font-mono text-[40px] leading-none tabular-nums" style={{ color: STATUS[calSt].color }}>
              {fmt(Math.abs(left))}
            </p>
            <p className="text-[13px] font-bold text-charcoal/55 mt-1.5">{left < 0 ? 'kcal over' : 'kcal left'}</p>
            <p className="text-xs font-mono text-charcoal/40 mt-0.5">{fmt(tot.cal)} / {fmt(t.calories)}</p>
          </div>
        </Rings>

        <div className="grid grid-cols-2 gap-2.5 mt-6">
          {stats.map((s) => (
            <div key={s.key} className="bg-cream rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] font-bold text-charcoal/70">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="text-[11px] font-bold" style={{ color: STATUS[s.st].color }}>{STATUS[s.st].label}</span>
              </div>
              <p className="font-mono mt-1.5 tabular-nums">
                <span className="text-xl">{Math.round(s.actual)}</span>
                <span className="text-sm text-charcoal/45"> / {s.target}g</span>
              </p>
              <div className="h-1.5 rounded-full bg-sand-dark mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, s.ratio * 100)}%`, background: STATUS[s.st].color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-black text-lg mb-3">{isToday ? 'Today so far' : 'Day summary'}</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [left < 0 ? 'Over by' : 'Calories left', `${fmt(Math.abs(left))}`, STATUS[calSt].color],
            ['Protein left', `${Math.round(protLeft)}g`, protLeft === 0 ? STATUS.ok.color : '#2A2A2A'],
            ['On target', `${onTargetCount}/5`, STATUS[onTargetCount >= 4 ? 'ok' : onTargetCount >= 2 ? 'warn' : 'pending'].color],
          ].map(([k, v, c]) => (
            <div key={k} className="bg-cream rounded-2xl py-3">
              <p className="font-mono text-lg tabular-nums" style={{ color: c }}>{v}</p>
              <p className="text-xs font-bold text-charcoal/50 mt-0.5">{k}</p>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <p className="text-[14px] text-charcoal/65 mt-3 leading-snug">
            {hit.length ? `Hit: ${hit.join(', ')}. ` : ''}
            {off.length ? `Over: ${off.join(', ')}. ` : ''}
            {!hit.length && !off.length ? 'Still filling up. Keep going.' : ''}
          </p>
        )}
      </Card>

      <div>
        <h3 className="font-black text-lg px-1 mb-2.5">Favourites</h3>
        {favs.length === 0 ? (
          <p className="text-[15px] text-charcoal/55 px-1">
            Tap the heart on any logged food to save it here and log it again in one tap.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {favs.map((fv) => (
              <div key={fv.id} className="shrink-0 flex items-center bg-sage-light rounded-2xl pl-1 pr-1">
                <button className="py-2.5 pl-3 pr-2 text-left active:scale-95 transition" onClick={() => addItem(fv)} aria-label={`Log ${fv.name}`}>
                  <p className="font-bold text-[14px] text-sage-dark leading-tight max-w-[140px] truncate">{fv.name}</p>
                  <p className="font-mono text-xs text-sage-dark/70">{fv.cal} kcal · P {fv.p}</p>
                </button>
                <IconButton label={`Remove ${fv.name} from favourites`} className="!h-8 !w-8 text-sage-dark/60" onClick={() => setFavs((l) => l.filter((x) => x.id !== fv.id))}>
                  <X size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <h3 className="font-black text-lg px-1">{isToday ? 'Today\u2019s log' : 'Log'}</h3>
        {items.length === 0 ? (
          <EmptyState icon={Utensils} title={isToday ? 'Nothing logged yet today' : 'Nothing logged this day'} body="Start with your first meal or snack. Favourites make repeat foods a single tap.">
            <Button size="lg" onClick={() => setAdding(true)}><Plus size={18} /> Log food</Button>
          </EmptyState>
        ) : (
          items.map((it) => (
            <div key={it.id} className="bg-sand rounded-2xl pl-4 pr-1.5 py-2.5 flex items-center gap-1">
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-tight truncate">{it.name}</p>
                <p className="font-mono text-xs text-charcoal/50 mt-0.5">
                  P {it.p} · C {it.c} · F {it.f}{it.fi ? ` · Fi ${it.fi}` : ''}
                </p>
              </div>
              <p className="font-mono text-[15px] pr-1 tabular-nums">{it.cal}</p>
              <IconButton label={isFav(it.name) ? 'Already a favourite' : 'Save to favourites'} onClick={() => saveFav(it)} className={isFav(it.name) ? '!text-sage' : ''}>
                <Heart size={18} fill={isFav(it.name) ? 'currentColor' : 'none'} />
              </IconButton>
              <IconButton label={`Delete ${it.name}`} onClick={() => removeItem(it.id)}><Trash2 size={18} /></IconButton>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && <Fab icon={Plus} onClick={() => setAdding(true)}>Log food</Fab>}
      {adding && <AddFood onClose={() => setAdding(false)} onAdd={(i) => addItem(i)} onFav={saveFav} />}
    </div>
  );
}
