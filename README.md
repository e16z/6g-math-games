# 🦝 Raccoon Heist

A visual, low-reading math game for 6th grade (Amplify Desmos Math, Grade 6).
Baron Grab, a smug robot, stole every snack in the city and locked them in his
8-floor tower. Each floor is one unit. Raccoons get them back with math.

**Units 1–4 are playable: 8 levels each, following the curriculum lessons in order.**
Each floor ends with a boss vault and a finale. Together the four floors build one
mystery: who is really running Baron?

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # checks the math, every puzzle, and that every line has a voice clip
npm run build      # static site in dist/ (host anywhere, works offline)
npm run voices     # record any new/changed spoken lines with ElevenLabs
```

## Voices

Every spoken line is pre-recorded with ElevenLabs (`eleven_v3`) and ships as an
MP3 in `public/voice/`, so the game needs no API key or internet to talk.

| Character | ElevenLabs voice ID |
|-----------|---------------------|
| Baron Grab | `Nagtyt9MktF8AWSgjotJ` |
| Hamster | `zauh4pbY6h1ZRErsRiAJ` |
| The ghost ("?") | `AocjYzHzWRalprWmBG9m` |
| Narrator & everything else | `6IwYbsNENZgAB1dtBZDp` |

- Voice IDs live in `src/engine/voicekey.ts`. Change one and run `npm run voices`
  to re-record that character.
- `npm run voices` reads `ELEVENLABS_API_KEY` from `.env` (gitignored), records
  only lines without a clip, deletes clips no longer used, and updates
  `src/voice-manifest.json`. Add `-- --dry` to preview or `-- --force` to
  re-record everything. Set `VOICE_MODEL=eleven_multilingual_v2` to switch models.
- If a line ever lacks a clip, the game falls back to the browser's built-in voice.

## How it plays (same in every level)

1. Look at the picture. The question is read aloud (🗣️ toggles voice).
2. Tap one of three big answers.
3. Watch what happens. Wrong answers cause a funny disaster, then leave a
   picture clue, and that answer greys out. Right answers fill in the equation.

No typing, no sliders, no menus inside a level.

### Floor 1 · Area & Surface Area
| # | Level | Lessons | What happens |
|---|-------|---------|--------------|
| 1 | Floor Tiles | 1–2 | Paint a laser floor with stealth paint. Too little: ZAP. Too much: SPLAT. Clue: count whole and half squares. |
| 2 | Slanty Floors | 3–5 | Parallelograms. Clue: cut the triangle, slide it over, it's a rectangle. |
| 3 | Triangles | 6–8 | Clue: a second copy makes a parallelogram, so ÷ 2. |
| 4 | Weird Rooms | 9 | Clue: the room splits into rectangles and triangles. |
| 5 | **Unfold!** | 10–12 | **Halfway trick:** 📦 unfolds any box into its net. |
| 6 | Gift Wrap | 12–13 | Wrap boxes exactly. Too little: SEEN! Too much: mummy raccoon. |
| 7 | Fill or Wrap? | 10, 13–14 | Volume vs surface area, back to back. |
| 8 | The Vault | 14 | Boss mix. |

### Floor 2 · Ratios
| # | Level | Lessons | What happens |
|---|-------|---------|--------------|
| 1 | Smoothie Lab | 1–3 | Scale a recipe. Too much: BLORP! Too little: BLEH! |
| 2 | Seesaw | 4 | Balance the seesaw or get launched. |
| 3 | Twin Tracks | 5 | Double number line; the cart rides to your answer. |
| 4 | Train Station | 7–8 | LCM (when do both trains come?) and GCF (matching snack bags). |
| 5 | **Per-1 Trick** | 6, 11 | **Halfway trick:** 1️⃣ adds the "1 row" to any ratio table. |
| 6 | Paint Shades | 9 | Which mix is darker? Hide in the shadows. |
| 7 | Party Planner | 10–12 | Ratio tables. Too little food: tomatoes. |
| 8 | The Vault | 13–15 | Tape diagrams, Two Guards, mix. |

### Floor 3 · Rates & Percents
| # | Level | Lessons | What happens |
|---|-------|---------|--------------|
| 1 | Size It Up | 1–2 | Best unit (count until you grow a beard) and which rope is longer. |
| 2 | Convert-o-matic | 3 | Unit conversions on twin tracks. |
| 3 | Robo Race | 4–5 | Bet on the fastest racer (unit rates). |
| 4 | Price Tags | 6–8 | Unit price and both unit rates. |
| 5 | **Percent Decoder** | 9–10 | **Halfway trick:** 🔍 splits the bar into equal % boxes (25% = ¼). |
| 6 | Mega Sale | 11–12 | Percent of a price, and the original price. |
| 7 | Percent Ray | 13–14 | Zap yourself to a percent of your height. |
| 8 | The Vault | 14 | Boss mix. |

### Floor 4 · Dividing Fractions
| # | Level | Lessons | What happens |
|---|-------|---------|--------------|
| 1 | Big or Small? | 1 | Send loot crates down the >1, =1 or <1 chute. Wrong chute: KA-BLAM. Clue: two bars compared. |
| 2 | Goo Bridge | 2, 3, 5 | The bridge collapses. How many planks cross the gap? Too few: goo. Too many: catapult. |
| 3 | Cookie Jars | 4, 8 | ¾ of a jar holds 12, so a full jar holds? Too many: jar explodes. Clue: snacks per band. |
| 4 | Snack Bars | 6, 7 | How many sticks fit in the bar? Both are cut into equal pieces (common denominator). |
| 5 | **Flip Trick** | 8, 9, 10 | **Halfway reveal.** Spot the pattern on the board, predict without the picture, unlock 🔄. |
| 6 | Grow Ray | 11, 12 | Zap the raccoon to the guard's height (× ?). Too big: BONK. Too small: pigeon. |
| 7 | Getaway | 13, 14 | Fill crates with ⅛ cubes and cut holes by area. Rattles, bursts, falls through. |
| 8 | The Vault | 15 | Boss: 6 locks mixing everything, plus *Two Guards* (one always lies). |

Finishing levels uncovers a top-secret picture: *who is Baron, really?*

## For teachers

- `?level=2-5` opens Unit 2, Level 5 directly (any unit-level)
- `?all` unlocks every level
- `?finale=1` plays a unit's ending (1–4)
- Progress is saved in the browser (localStorage), per device

## Adding a unit

1. Copy a unit file (e.g. `src/units/unit2.ts`) to `src/units/unitN.ts`.
2. Write levels as **data**: a mechanic name plus numbers. Answers and wrong
   options are computed exactly with fractions (`src/engine/frac.ts`), never
   typed by hand.
3. In `src/units/index.ts`, replace that floor's `soon(...)` with your unit.
4. Run `npm run voices` to record the new lines, then `npm test`. Every round
   is validated (options distinct and positive, pictures fit on screen, intro
   lines short, every line recorded).

Reuse a mechanic where the math fits, or add a new file in `src/mechanics/`
that implements `Mechanic` (`build` draws the scene and plays consequences,
`validate` checks the data, `lines` lists what it says out loud) and list it
in `src/mechanics/index.ts`.

Design checklist for every unit:

1. Start with something happening (collapsing bridge, incoming message).
2. Mistakes are funny and leave a clue.
3. Give kids something to compare (bars, guards, sizes).
4. The math gives them power (the Flip Trick cracks "impossible" problems).
5. Reveal a deeper rule halfway and let it change how they play.
6. **Keep it simple:** one tap-an-answer interaction, very little reading.

## Code map

```
src/engine/     fractions, DOM helpers, sound synth, voice playback, save data, types
scripts/        voices.ts: records every spoken line with ElevenLabs
public/voice/   the recorded MP3 clips
src/art/        raccoon (hats + gag effects), Baron, guards, hamster (all SVG)
src/mechanics/  area, wrap · recipe, scale, dnl, multiples, paint, table, tape · units, race ·
                sort, bridge, jar, slicer, flip, ray, crate, guards (see index.ts)
src/screens/    home, story, hats, tower (units), map (levels), level
src/units/      unit content (unit1.ts … unit4.ts) + the list of 8 floors
tests/          fraction math + content validation
```
