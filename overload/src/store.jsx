import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { DEFAULT_SETTINGS, uid } from './utils.js';

// One localStorage key per "table", all prefixed and versioned for future DB migration.
//   settings          object          profile, unit, targets
//   programs          [{id,name,exercises:[{id,name,muscle}]}]
//   workouts          { 'yyyy-mm-dd': [session] }
//   food              { 'yyyy-mm-dd': [{id,name,cal,p,c,f,fi}] }
//   favourites        [{id,name,cal,p,c,f,fi}]
//   weights           { 'yyyy-mm-dd': {kg, note} }   (always stored in kg)
//   activeWorkout     in-progress session or null
const PREFIX = 'overload:v1:';
const KEYS = ['settings', 'programs', 'workouts', 'food', 'favourites', 'weights', 'activeWorkout'];

function read(key, init) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : init;
  } catch {
    return init;
  }
}

function useLS(key, init) {
  const [v, setV] = useState(() => read(key, init));
  useEffect(() => {
    try {
      if (v === null || v === undefined) localStorage.removeItem(PREFIX + key);
      else localStorage.setItem(PREFIX + key, JSON.stringify(v));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, v]);
  return [v, setV];
}

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [rawSettings, setSettings] = useLS('settings', DEFAULT_SETTINGS);
  const [programs, setPrograms] = useLS('programs', []);
  const [workouts, setWorkouts] = useLS('workouts', {});
  const [food, setFood] = useLS('food', {});
  const [favs, setFavs] = useLS('favourites', []);
  const [weights, setWeights] = useLS('weights', {});
  const [active, setActive] = useLS('activeWorkout', null);

  const [tab, setTab] = useState('train');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const settings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      targets: { ...DEFAULT_SETTINGS.targets, ...(rawSettings.targets || {}) },
    }),
    [rawSettings]
  );

  const toast = useCallback((msg, type = 'ok') => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const exportAll = useCallback(
    () => ({
      app: 'overload',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      programs,
      workouts,
      food,
      favourites: favs,
      weights,
    }),
    [settings, programs, workouts, food, favs, weights]
  );

  const importAll = useCallback(
    (d) => {
      if (!d || d.app !== 'overload') throw new Error('Not an Overload export file.');
      if (d.settings) setSettings(d.settings);
      if (d.programs) setPrograms(d.programs);
      if (d.workouts) setWorkouts(d.workouts);
      if (d.food) setFood(d.food);
      if (d.favourites) setFavs(d.favourites);
      if (d.weights) setWeights(d.weights);
      setActive(null);
      setWorkoutOpen(false);
    },
    [setSettings, setPrograms, setWorkouts, setFood, setFavs, setWeights, setActive]
  );

  const resetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setPrograms([]);
    setWorkouts({});
    setFood({});
    setFavs([]);
    setWeights({});
    setActive(null);
    setWorkoutOpen(false);
    KEYS.forEach((k) => {
      try { localStorage.removeItem(PREFIX + k); } catch { /* ignore */ }
    });
  }, [setSettings, setPrograms, setWorkouts, setFood, setFavs, setWeights, setActive]);

  const value = {
    settings, setSettings: setSettings,
    programs, setPrograms,
    workouts, setWorkouts,
    food, setFood,
    favs, setFavs,
    weights, setWeights,
    active, setActive,
    tab, setTab,
    workoutOpen, setWorkoutOpen,
    toasts, toast,
    exportAll, importAll, resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
