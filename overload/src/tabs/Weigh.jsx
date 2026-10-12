import { useMemo, useState } from 'react';
import { Minus, Plus, Scale, Target, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../store.jsx';
import { Button, Card, EmptyState, Fab, Field, IconButton, NumInput, PageTitle, Seg, Sheet, TextInput } from '../components/ui.jsx';
import { addDays, avg, etaToGoal, fromDisplay, isoDate, longDate, round, shortDate, sortedWeights, toDisplay, weeklyTrend } from '../utils.js';

function WeighSheet({ initialDate, onClose }) {
  const { weights, setWeights, settings, toast } = useApp();
  const unit = settings.unit;
  const load = (d) => (weights[d] ? round(toDisplay(weights[d].kg, unit), 2) : '');
  const [date, setDate] = useState(initialDate);
  const [val, setVal] = useState(load(initialDate));
  const [note, setNote] = useState(weights[initialDate]?.note || '');

  const changeDate = (d) => {
    if (!d) return;
    setDate(d);
    setVal(load(d));
    setNote(weights[d]?.note || '');
  };

  const save = () => {
    const n = Number(val);
    if (!n || n <= 0) return toast('Enter your weight first', 'warn');
    if (n > 700) return toast('That looks too high. Check the number.', 'warn');
    setWeights((w) => ({ ...w, [date]: { kg: round(fromDisplay(n, unit), 3), note: note.trim() } }));
    toast('Weigh-in saved');
    onClose();
  };

  return (
    <Sheet title="Log weight" onClose={onClose} footer={<Button size="lg" className="w-full" onClick={save}>Save weigh-in</Button>}>
      <Field label="Weight" hint={unit}>
        <NumInput value={val} onChange={setVal} placeholder={unit === 'kg' ? 'e.g. 64.2' : 'e.g. 141.5'} className="!h-16 !text-3xl text-center" autoFocus />
      </Field>
      <Field label="Date">
        <TextInput type="date" max={isoDate()} value={date} onChange={(e) => changeDate(e.target.value)} />
      </Field>
      <Field label="Note (optional)">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. cheat day yesterday, deload week" maxLength={120} />
      </Field>
    </Sheet>
  );
}

export default function Weigh() {
  const { weights, setWeights, settings, toast, setTab } = useApp();
  const unit = settings.unit;
  const today = isoDate();
  const [range, setRange] = useState(30);
  const [sheet, setSheet] = useState(null);

  const list = useMemo(() => sortedWeights(weights), [weights]);
  const latest = list[list.length - 1];
  const trend = useMemo(() => weeklyTrend(list, today), [list, today]);
  const goalKg = Number(settings.goalWeightKg) || null;
  const goal = goalKg ? round(toDisplay(goalKg, unit), 2) : null;

  const data = useMemo(() => {
    const start = addDays(today, -(range - 1));
    return Array.from({ length: range }, (_, i) => {
      const d = addDays(start, i);
      const e = weights[d];
      let a = null;
      if (e) {
        const win = [];
        for (let k = 0; k < 7; k++) {
          const x = weights[addDays(d, -k)];
          if (x) win.push(x.kg);
        }
        a = round(toDisplay(avg(win), unit), 2);
      }
      return { date: d, w: e ? round(toDisplay(e.kg, unit), 2) : null, avg: a, note: e?.note || '' };
    });
  }, [weights, range, unit, today]);

  const vals = data.flatMap((x) => [x.w, x.avg]).filter((v) => v != null);
  const hasData = vals.length > 0;
  const domain = useMemo(() => {
    const all = goal ? [...vals, goal] : vals;
    if (!all.length) return [0, 1];
    return [Math.floor(Math.min(...all) - 1), Math.ceil(Math.max(...all) + 1)];
  }, [vals.join(','), goal]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = trend ? toDisplay(trend.delta, unit) : null;
  const steady = delta !== null && Math.abs(delta) < 0.05;
  const eta = latest && goalKg && trend ? etaToGoal(latest.kg, goalKg, trend.delta, today) : null;

  const etaText = () => {
    if (!eta) return 'Log a few more weigh-ins to estimate your finish line.';
    if (eta.state === 'reached') return 'You are at your goal weight.';
    if (eta.state === 'off') return 'Not trending toward your goal yet. Give it another week or two.';
    if (eta.state === 'far') return 'At this pace the goal is over two years away.';
    const w = Math.round(eta.weeks);
    return `About ${w < 1 ? 'a week' : `${w} week${w > 1 ? 's' : ''}`} at your current pace, around ${shortDate(eta.date)}.`;
  };

  const remove = (d) => {
    setWeights((w) => {
      const n = { ...w };
      delete n[d];
      return n;
    });
    toast('Weigh-in deleted');
  };

  if (!list.length) {
    return (
      <div>
        <PageTitle title="Weigh-in" sub="One number a day. The trend tells the story." />
        <EmptyState icon={Scale} title="Your trend starts with one weigh-in" body="Log today's weight and Overload smooths the day-to-day noise into a trend line you can trust.">
          <Button size="lg" onClick={() => setSheet(today)}><Plus size={18} /> Log today's weight</Button>
        </EmptyState>
        {sheet && <WeighSheet initialDate={sheet} onClose={() => setSheet(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Weigh-in" sub={`Latest: ${round(toDisplay(latest.kg, unit), 1)}${unit} on ${longDate(latest.date)}`} />

      <Card>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-sage-light text-sage-dark grid place-items-center shrink-0">
            {delta === null || steady ? <Minus size={24} /> : delta < 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
          </div>
          <div className="min-w-0">
            {delta === null ? (
              <p className="font-black text-lg leading-tight">Trend appears after a few weigh-ins</p>
            ) : (
              <>
                <p className="font-mono text-2xl leading-tight tabular-nums text-sage-dark">
                  {steady ? 'Holding steady' : `${delta > 0 ? '+' : '\u2212'}${Math.abs(round(delta, 1))}${unit} this week`}
                </p>
                <p className="text-[13px] text-charcoal/55 mt-1">
                  {trend.method === 'week' ? 'Average of the last 7 days vs the 7 before.' : 'Estimated from your recent weigh-ins.'}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-sand-dark flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-sage-light text-sage-dark grid place-items-center shrink-0"><Target size={22} /></div>
          <div className="min-w-0 flex-1">
            {goal ? (
              <>
                <p className="font-black text-lg leading-tight">Goal {goal}{unit}</p>
                <p className="text-[14px] text-charcoal/65 mt-1 leading-snug">{etaText()}</p>
              </>
            ) : (
              <>
                <p className="font-black text-lg leading-tight">No goal weight yet</p>
                <p className="text-[14px] text-charcoal/65 mt-1 leading-snug">Set one in Plan to see a goal line and an estimated finish date.</p>
                <Button size="sm" variant="soft" className="mt-2.5" onClick={() => setTab('plan')}>Set a goal</Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="!px-3">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="font-black text-lg">Trend</h3>
          <Seg value={range} onChange={setRange} options={[{ value: 7, label: '7d' }, { value: 30, label: '30d' }, { value: 90, label: '90d' }]} />
        </div>
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#E8E0D2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#2A2A2A99', fontFamily: '"DM Mono", monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={36} />
                <YAxis domain={domain} allowDecimals={false} tick={{ fontSize: 11, fill: '#2A2A2A99', fontFamily: '"DM Mono", monospace' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: 'none', background: '#FAF8F4', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
                  labelFormatter={(d) => longDate(d)}
                  formatter={(v, n) => [`${v}${unit}`, n === 'w' ? 'Weigh-in' : '7-day average']}
                />
                {goal && <ReferenceLine y={goal} stroke="#B5645A" strokeDasharray="6 5" strokeWidth={1.5} label={{ value: `Goal ${goal}`, position: 'insideTopRight', fontSize: 11, fill: '#B5645A' }} />}
                <Line type="monotone" dataKey="w" name="w" stroke="#9DB09B" strokeWidth={1.5} dot={{ r: 3.5, fill: '#5E7A5E', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="avg" name="avg" stroke="#3D5A3D" strokeWidth={3} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-[15px] text-charcoal/55 py-10 text-center px-4">No weigh-ins in the last {range} days. Log one to bring the chart back.</p>
        )}
        <div className="flex gap-4 px-3 pt-2 text-xs font-bold text-charcoal/55">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-sage" /> Weigh-in</span>
          <span className="flex items-center gap-1.5"><i className="h-1 w-4 rounded bg-sage-dark" /> 7-day average</span>
          {goal && <span className="flex items-center gap-1.5"><i className="w-4 border-t-2 border-dashed border-over" /> Goal</span>}
        </div>
      </Card>

      <div className="space-y-2.5">
        <h3 className="font-black text-lg px-1">Recent weigh-ins</h3>
        {[...list].reverse().slice(0, 14).map((e) => (
          <div key={e.date} className="bg-sand rounded-2xl pl-4 pr-1.5 py-2.5 flex items-center gap-2">
            <button className="flex-1 min-w-0 text-left" onClick={() => setSheet(e.date)} aria-label={`Edit weigh-in for ${longDate(e.date)}`}>
              <p className="font-bold leading-tight">{longDate(e.date)}</p>
              {e.note && <p className="text-[13px] text-charcoal/55 mt-0.5 truncate">{e.note}</p>}
            </button>
            <p className="font-mono text-lg tabular-nums">{round(toDisplay(e.kg, unit), 1)}<span className="text-sm text-charcoal/45">{unit}</span></p>
            <IconButton label="Delete weigh-in" onClick={() => remove(e.date)}><Trash2 size={18} /></IconButton>
          </div>
        ))}
      </div>

      <Fab icon={Plus} onClick={() => setSheet(weights[today] ? today : today)}>{weights[today] ? 'Update today' : 'Log weight'}</Fab>
      {sheet && <WeighSheet initialDate={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
