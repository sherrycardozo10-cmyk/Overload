import { useEffect, useState } from 'react';
import { Check, Dumbbell, Scale, Target, Trophy, Utensils, AlertCircle } from 'lucide-react';
import { useApp } from './store.jsx';
import Train from './tabs/Train.jsx';
import Eat from './tabs/Eat.jsx';
import Weigh from './tabs/Weigh.jsx';
import Plan from './tabs/Plan.jsx';
import ActiveWorkout from './components/ActiveWorkout.jsx';
import { Seg, cx } from './components/ui.jsx';
import { fmtClock } from './utils.js';

const TABS = [
  { id: 'train', label: 'Train', icon: Dumbbell, C: Train },
  { id: 'eat', label: 'Eat', icon: Utensils, C: Eat },
  { id: 'weigh', label: 'Weigh-in', icon: Scale, C: Weigh },
  { id: 'plan', label: 'Plan', icon: Target, C: Plan },
];

function ResumePill() {
  const { active, setWorkoutOpen } = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <button
      onClick={() => setWorkoutOpen(true)}
      className="fixed z-30 left-1/2 -translate-x-1/2 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] h-11 pl-4 pr-5 rounded-full bg-sage-dark text-cream shadow-lg flex items-center gap-3 active:scale-95 transition"
    >
      <span className="h-2 w-2 rounded-full bg-sage-light animate-breathe" />
      <span className="text-sm font-bold">Workout</span>
      <span className="font-mono text-sm tabular-nums">{fmtClock((now - active.startedAt) / 1000)}</span>
      <span className="text-sm font-bold text-sage-light">Resume</span>
    </button>
  );
}

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed z-[70] inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] flex flex-col items-center gap-2 pointer-events-none px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'animate-toast flex items-center gap-2.5 pl-3 pr-4 h-11 rounded-full shadow-lg text-[14px] font-bold',
            t.type === 'warn' ? 'bg-warn text-charcoal' : t.type === 'pr' ? 'bg-sage-dark text-cream' : 'bg-charcoal text-cream'
          )}
        >
          {t.type === 'warn' ? <AlertCircle size={18} /> : t.type === 'pr' ? <Trophy size={18} /> : <Check size={18} className="text-sage-light" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { tab, setTab, settings, setSettings, active, workoutOpen } = useApp();
  const Current = TABS.find((t) => t.id === tab).C;

  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 flex items-center justify-between">
          <h1 className="text-[28px] leading-none font-black tracking-[-0.04em] text-sage-dark">
            overload<span className="text-sage">.</span>
          </h1>
          <Seg
            value={settings.unit}
            onChange={(u) => setSettings((s) => ({ ...s, unit: u }))}
            options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
          />
        </div>
      </header>

      <main key={tab} className="max-w-xl mx-auto px-5 pb-44 animate-tab">
        <Current />
      </main>

      {active && !workoutOpen && <ResumePill />}

      <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none md:pb-4" aria-label="Main">
        <div className="pointer-events-auto max-w-xl mx-auto bg-cream/95 backdrop-blur-md border-t border-sand-dark md:border md:rounded-full md:shadow-lg md:max-w-md pb-[env(safe-area-inset-bottom)]">
          <ul className="flex">
            {TABS.map(({ id, label, icon: Icon }) => {
              const on = tab === id;
              return (
                <li key={id} className="flex-1">
                  <button
                    onClick={() => setTab(id)}
                    aria-current={on ? 'page' : undefined}
                    className={cx('w-full pt-2.5 pb-2 flex flex-col items-center gap-1 transition-colors', on ? 'text-sage' : 'text-charcoal/45')}
                  >
                    <span className={cx('h-8 w-14 rounded-full grid place-items-center transition-colors', on && 'bg-sage-light')}>
                      <Icon size={22} strokeWidth={on ? 2.4 : 2} />
                    </span>
                    <span className={cx('text-[11px] leading-none', on ? 'font-black' : 'font-bold')}>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {active && workoutOpen && <ActiveWorkout />}
      <Toasts />
    </div>
  );
}
