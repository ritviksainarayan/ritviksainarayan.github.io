# Sky Trainer

A self-contained constellation trainer that lives at `/sky-trainer/` on ritviksainarayan.com.
No build step: plain HTML, CSS and JavaScript, served as static files.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | App shell, loads the scripts below in order |
| `css/sky.css` | Styles (shares the site's dark space palette and fonts) |
| `js/data.js` | Generated: 2855 stars (mag ≤ 5.5 plus figure stars) and 88 constellation line figures |
| `js/content.js` | Hand-written teaching content: introduction order, cues, star-hops, stories |
| `js/astro.js` | Projection, sidereal time, altitude/azimuth |
| `js/render.js` | Canvas drawing: constellation charts and the all-sky dome |
| `js/srs.js` | Spaced-repetition scheduler, stage-aware mastery ladder, session builder, localStorage |
| `js/app.js` | Views (Learn, Train, Sky now, Progress), flashcard loop, difficulty bar, onboarding |

## Linking from the homepage

Any link to `sky-trainer/` works, for example a planet in the solar-system view or a line in the About panel:

```html
<a href="sky-trainer/">Learn the constellations</a>
```

## Regenerating the data

`js/data.js` was built from d3-celestial's `stars.6.json`, `constellations.lines.json`,
`constellations.json` and `starnames.json` (BSD-3, Olaf Frohn; positions from the HYG database).
The build script only trims and re-indexes; rerun it if you want a fainter magnitude limit.

## Learning design

- One pool of all 88 constellations, introduced in prominence order (bright, famous shapes first). No seasonal decks;
  when-to-see-it and how-it's-formed live in a click-to-open dropdown on every card.
- Flashcards: see a patch of sky, guess, flip, rate yourself (Missed / Got it). No separate study step.
- Difficulty bar on every card: Lines, Rotate, Field stars, Wide field, and a sky-darkness slider. Auto mode follows
  each card's ladder stage; manual switches let you make any card harder at will.
- Stage-aware SM-2 scheduling: a correct answer at stage s lifts the ladder to s+1; a miss drops it below the stage it
  failed at, resets the interval, and re-queues the card within the session.
- Star-hopping and story hooks on each card; the live sky map ties practice to the real sky at the learner's location.
