import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Card({ className = '', children, ...p }) {
  return (
    <section className={cx('bg-sand rounded-3xl p-5', className)} {...p}>
      {children}
    </section>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', ...p }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none';
  const v = {
    primary: 'bg-sage text-cream hover:bg-sage-dark',
    dark: 'bg-sage-dark text-cream',
    soft: 'bg-sage-light text-sage-dark hover:bg-[#cfdccc]',
    ghost: 'text-sage-dark hover:bg-sand-dark/60',
    danger: 'bg-over/10 text-over hover:bg-over/20',
  };
  const s = { sm: 'h-9 px-3.5 text-sm', md: 'h-12 px-5 text-[15px]', lg: 'h-14 px-6 text-base' };
  return <button className={cx(base, v[variant], s[size], className)} {...p} />;
}

export function IconButton({ label, className = '', children, ...p }) {
  return (
    <button
      aria-label={label}
      className={cx(
        'h-10 w-10 shrink-0 rounded-full grid place-items-center text-charcoal/60 hover:bg-sand-dark/60 active:scale-95 transition',
        className
      )}
      {...p}
    >
      {children}
    </button>
  );
}

export const inputCls =
  'w-full h-12 rounded-2xl bg-cream border border-sand-dark px-4 text-[15px] outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 placeholder:text-charcoal/30';

export function TextInput({ className = '', ...p }) {
  return <input className={cx(inputCls, className)} {...p} />;
}

export function Select({ className = '', children, ...p }) {
  return (
    <select className={cx(inputCls, 'appearance-none pr-10 bg-no-repeat', className)} {...p}>
      {children}
    </select>
  );
}

// Numeric input: shows the numeric keyboard, keeps what the user typed (e.g. "70."),
// and reports a number (or '' when empty) upward.
export function NumInput({ value, onChange, decimal = true, className = '', ...p }) {
  const show = (v) => (v === '' || v == null ? '' : String(v));
  const [txt, setTxt] = useState(show(value));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setTxt(show(value));
    }
  }, [value]);
  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      pattern={decimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      autoComplete="off"
      className={cx(inputCls, 'font-mono', className)}
      value={txt}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.');
        if (!(decimal ? /^\d*\.?\d*$/ : /^\d*$/).test(t)) return;
        setTxt(t);
        const n = t === '' || t === '.' ? '' : parseFloat(t);
        last.current = n;
        onChange(n);
      }}
      {...p}
    />
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={cx('block', className)}>
      <span className="flex items-baseline justify-between mb-1.5 px-1">
        <span className="text-[13px] font-bold text-charcoal/70">{label}</span>
        {hint && <span className="text-xs font-mono text-charcoal/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Seg({ value, onChange, options, className = '' }) {
  return (
    <div className={cx('inline-flex p-1 bg-sand-dark/50 rounded-2xl', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-9 px-3.5 rounded-xl text-sm font-bold transition',
            value === o.value ? 'bg-cream text-sage-dark shadow-sm' : 'text-charcoal/55'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'h-11 px-4 rounded-2xl text-sm font-bold transition active:scale-95',
        active ? 'bg-sage text-cream' : 'bg-cream border border-sand-dark text-charcoal/70',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-charcoal/40 animate-fade" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg bg-cream rounded-t-[28px] md:rounded-[28px] max-h-[90dvh] flex flex-col animate-sheet shadow-2xl"
      >
        <div className="flex items-center justify-between pl-6 pr-3 pt-4 pb-2">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        <div className="px-6 pb-5 pt-1 overflow-y-auto flex-1 space-y-4">{children}</div>
        {footer && (
          <div className="px-6 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-sand-dark/70 space-y-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, children }) {
  return (
    <div className="bg-sand rounded-3xl px-6 py-9 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-sage-light text-sage-dark grid place-items-center">
        <Icon size={26} />
      </div>
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[15px] text-charcoal/60 max-w-xs mx-auto leading-snug">{body}</p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">{children}</div>
    </div>
  );
}

// Sticky primary action that stays in thumb reach, above the nav bar.
export function Fab({ onClick, icon: Icon, children }) {
  return (
    <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10 flex justify-end pointer-events-none mt-4">
      <button
        onClick={onClick}
        className="pointer-events-auto h-14 pl-5 pr-6 rounded-full bg-sage text-cream font-bold shadow-lg shadow-sage-dark/25 inline-flex items-center gap-2 active:scale-95 transition"
      >
        <Icon size={20} />
        {children}
      </button>
    </div>
  );
}

export function PRBadge({ label = 'PR' }) {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-warn/20 text-[#8A6420] text-xs font-black tracking-wide animate-pop">
      {label}
    </span>
  );
}

export function PageTitle({ title, sub }) {
  return (
    <div className="pt-2 pb-5">
      <h2 className="text-[32px] leading-none font-black tracking-tight text-charcoal">{title}</h2>
      {sub && <p className="mt-2 text-[15px] text-charcoal/55">{sub}</p>}
    </div>
  );
}
