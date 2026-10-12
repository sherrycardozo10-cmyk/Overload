# overload.

Progressive overload, macros and weigh-ins in one installable PWA.
React 18 + Vite, Tailwind, recharts, lucide-react. No backend, no auth, no API calls.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build (service worker only registers in production builds)
```

Deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages). It needs HTTPS to be installable.
The build uses relative paths (`base: './'`), so it works at a domain root or a sub-path.

Install on a phone: iOS Safari > Share > Add to Home Screen. Android Chrome > Install app.
Offline use works after the first online visit (app shell + fonts are cached by `public/sw.js`).

## Data model (localStorage, kg internally)

| Key | Shape |
| --- | --- |
| `overload:v1:settings` | profile, unit, rest default, targets |
| `overload:v1:programs` | `[{id, name, exercises:[{id,name,muscle}]}]` |
| `overload:v1:workouts` | `{ "yyyy-mm-dd": [session] }`, session = `{id, programName, durationSec, entries:[{name,muscle,sets:[{reps,weightKg}],prs}]}` |
| `overload:v1:food` | `{ "yyyy-mm-dd": [{id,name,cal,p,c,f,fi}] }` |
| `overload:v1:favourites` | `[{id,name,cal,p,c,f,fi}]` |
| `overload:v1:weights` | `{ "yyyy-mm-dd": {kg, note} }` |
| `overload:v1:activeWorkout` | in-progress session or null |

Plan > Back up exports all of it as one JSON file (and Restore re-imports it), which is also the easiest path to a future database.

## Rules worth knowing

- PR = an exercise's total volume (sum of weight x reps over completed sets) beats your previous best, or your heaviest set does.
- Eat status: calories, carbs and fat are "on target" within 10%, "slightly off" to 20%, red beyond 20% over. Protein and fibre count as hit at 90% or more.
- Weekly trend = average of last 7 days minus average of the 7 before (falls back to a regression slope if you have less data).
- Nudges: weight flat for 2+ weeks on fat loss or muscle gain suggests 100 kcal; fat loss faster than 1% bodyweight a week suggests eating 100 kcal more.
