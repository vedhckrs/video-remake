# World brief - "6 AI agents that work for you 24/7: which one is yours?" (six-agents, 25 Nov 2026)

You design WORLDS for one 9:16 tech explainer rendered with Remotion (React + SVG in headless Chrome,
1080x1920 @ 60 fps; scene code works in DESIGN frames @30, fractional at 60). Scenes are drawn in code (SVG/CSS
that reads as 2.5D) AND use the REAL mascots, logos and screenshots captured from each agent's official site.

## The client and the quality bar
Ved is a senior graphic designer. His standing notes on this series (they all apply):
- "remove presenter" - the world fills the whole frame; captions sit on top (y 15-25 %), never draw there.
- "each word spoken I want a visual change ... animation and new world design" - something in the world must
  visibly react to MOST spoken words (light up, build, count, move, transform, a mascot reacts).
- "camera jump too much ... only where required ... camera smoothly, not frame jiggle" - see Camera below.
- "make visual more powerful", an earlier demo "looks cheap" (small objects floating in black, flat colours):
  full-bleed, rich, premium UI/product illustration; real materials (glass, glossy, emissive), dense micro-detail,
  real lighting (glows, light pools, rim light), depth (foreground/background layers), NOTHING flat or empty.
- For THIS video: "use real logo and animated mascot their real agents ... if required add source screenshot and
  highlight". So each agent's REAL mascot is the star of its scene and it is ANIMATED (pops in, floats, peeks from a
  card edge, hops onto a computer, reacts on words) - but its artwork is never altered (see Assets).
- Look at the approved worlds for level and code patterns:
  `C:\Users\VED\.claude\skills\video-remake\references\example-explainer\fps-video\worlds\*.tsx` (+ `contact_sheet.jpg`)
  and `...\ssd-video-v3\worlds\*.tsx`. Read 2 of them before you start.

## How a world works (read `src/kit/explainer/world.tsx` in your sandbox)
- A scene renders `<World def={myWorld} t={t} dur={dur} beats={spec.beats} W={W} H={H} />`.
- **Your `Draw` must return its own `<svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0,
  overflow: 'visible'}}>`** (e.g. WW=2600, WH=3400) - SVG shapes returned without an svg root do not render.
- `spec.beats`: one beat per spoken content word, from `projects/six-agents/project.json` (each scene's `beats`):
  `{t, w, word, kind: number|action|state|object|drift, s: 1..3}`, t in DESIGN frames from scene start.
- `WorldDef = {id, home, anchors: {name: {x, y, zoom}}, aliases?, palette?, Draw, Overlay?}`. Anchor zoom 1 = 1 world
  px per screen px; the anchor lands at screen (540, 0.50*1920). `home` = the framing the scene starts on.
- **Camera (the director enforces Ved's rules):** moves ONLY when the voice names an anchor (word = anchor name, its
  plural, or an `aliases` entry), at most one move per phrase, each a 1-1.8 s ease-in-out, then a slow dolly. No
  shake. Give each scene 1-3 anchors named after key nouns (e.g. `computer`, `apps`, `iMessage`), zooms that keep
  the subject big (80-90 % of the width).
- **Per-word change comes from YOUR Draw**: `onWord(t, beats, 'word')`, `wordAt`, `pulseOn`, `countOn`, `nthBeat`,
  `step`, `Burst`, `Ripple`. Never fake a camera with a word-triggered whole-world scale.
- `Overlay` (optional) draws screen-locked labels/counters with `toScreen(x, y)`.
- The engine adds palette gradient, parallax particles, foreground bokeh, light pulse on beats, light shafts,
  grade, caption gradient, vignette. Set `palette` (`bg0`, `bg1`, `particles`, `glow`) per world.
- Kit (read, never edit `src/kit`): `iso.tsx`, `hardware.tsx`, `premium.tsx` (DrumCounter, HeroNumber, GlassCard,
  PhoneFrame ...), `stage.tsx` (Callout, Stamp, Badge, Meter, FlowPath, FONT, MONO), `tokens.ts`, `nano.tsx`.
  Simple Icons logos: `import {siWhatsapp} from 'simple-icons'` -> `<path d={siWhatsapp.path} fill={'#' + siWhatsapp.hex}/>`
  in a 24x24 box (scale it). Available: siMeta siX siAnthropic siClaude siGithub siWhatsapp siTelegram siDiscord
  siImessage siGmail siStripe siShopify siQuickbooks siGusto siHubspot siSignal siZendesk siApple siAndroid siMacos
  siLinux siGooglecalendar siInstagram siFacebook siMessenger siOllama siOpenrouter siCursor (NOT available: OpenAI,
  xAI, Slack, LinkedIn, Docusign, Canva, Zoom - use the captured PNG logos below or a neutral glyph + text).

## Assets - `projects/six-agents/worlds/shared.tsx` (READ it; never edit it)
- `SvgImg` - THE way to put a bitmap in your svg (waits until loaded; supports fit cover/contain, radius, filter
  e.g. `invert(1)` for a black logo on dark). Never use a bare `<image>` or `<foreignObject>`.
- `ASSETS` - every real image with its size and what it shows (Dots slides + Iggy/Alfred/Todd/Jojo card art + ring
  logo + OpenAI wordmark; Muse creature, app icon, feature images; 9 Grok Bot bots + Grok Bot logo + xAI logo;
  Claude Duet app icon; OpenClaw lobster + real GitHub header; Hermes hero art, bust, wing + real GitHub header;
  full official page screenshots).
- `AGENTS` - name, maker, colours (accent/deep/glow), price line, runs-on, asks-first line per agent.
- `AgentCard` - the shared premium glass card (mascot window + name + maker + optional price tag). Use it so the
  six scenes feel like one family (e.g. your scene can open on its card and the card opens up into the world).
- `bob(t, seed)` - gentle float/tilt/breathing for mascots.
- Mascot rule: move, scale, rotate, float, peek from an edge, pop in/out, fade - YES. Recolour, redraw, crop a part
  off (other than the provided crops), add props/accessories, or put words in its mouth as if it said them - NO.
  Mascots may appear in their official pastel card window (that is how OpenAI/Meta draw them).
- Screenshots as "source proof": show a REAL page crop (e.g. the GitHub header with the Star count) on a glass
  panel and HIGHLIGHT the key part (a glowing marker box / underline sweeping onto it on its word). Keep it whole
  (never a subject cut by its frame), readable (>= 30 px text on the 1080 frame).

## Facts (use exactly these; nothing else numeric) - all checked on official pages 25 Nov 2026
- Dots (OpenAI): each dot = its own cloud computer + browser · connects to over 4,000 apps · text it via iMessage
  (beta) · asks before it pays (review + Face ID) · included with ChatGPT Pro, from $100/month · not in the EU / UK
  yet. Mascot names on OpenAI's page: Iggy (pink, headphones), Alfred (yellow), Todd (green), Jojo (heart), Felipe (blue).
- Muse (Meta): books trips, shops (checks out with Link by Stripe), negotiates bills, works inside WhatsApp · checks
  with you before it spends · free for most tasks; Power $20/mo, Maximum $100/mo · only in the US and Singapore.
- Grok Bot (xAI): built for teams · every bot has its own computer · signs into your work apps · joins Slack /
  Teams and Google Meet / Zoom / Teams calls · included with X Premium $30, Super $100, Ultra $200 · weekly usage
  pool, extra use billed on top (top-ups).
- Claude Duet (Anthropic): morning brief · spots unpaid invoices (QuickBooks / Stripe) · prepares and runs payroll
  (Gusto) · before it sends, pays, signs or deletes it shows you and waits · never moves money between accounts (or
  trades) even with approval · included in Claude Pro ($20/mo), Max, Ultra · research preview, US waitlist.
- OpenClaw (OpenClaw Foundation, non-profit): 395,174 GitHub stars (25 Nov 2026; header shows "395k") · MIT, free,
  no paid tier · runs on your own computer (macOS, Windows, Linux) · chat from WhatsApp, Telegram, iMessage, Discord,
  Slack, Teams + 20 more · tools run on your machine, sandboxing is OFF by default -> "lock it down".
- Hermes (Nous Research): writes itself a new skill after a hard task; skills improve with use · persistent memory
  · 265,993 GitHub stars (header "266k") · MIT, free, use any AI model (OpenRouter, your own endpoint ...) · hosted
  cloud from $20/month (Nous Portal Plus) · chat from Telegram, Discord, Slack, WhatsApp, Signal, email.
No creator handle, channel name, follower counts, or claims beyond these. Never imply a brand endorses the video.

## Scenes (voice, design frames @30 from scene start; full beats in project.json)
Output frame (@60) of a design frame d in scene X = X.from + 2*d.
| scene | from..to (output @60) | voice | plan |
|---|---|---|---|
| S01 hook | 0..411 | "Six AI agents now do real work for you, even while you sleep. Same promise. Very different deals." | 'Agent wall': six AgentCards fly in (already moving on frame 0) into a 3x2 wall; mascots alive; 'sleep' -> night (moon, room dims) while cards glow 'working'; 'promise' -> one shared glint; 'different' -> cards split apart, price tags flip on (AgentCard `price`). |
| S02 | 411..820 (dissolve in) | "Four of them live in a big company's cloud, on their own computer. Two are free, open source, and run on yours." | 'Cloud vs your PC': four cloud-agent cards rise into a glowing cloud, each docks into its own small cloud computer; OpenClaw + Hermes drop onto a desk laptop, badge 'OPEN SOURCE · MIT · FREE'. END STATE: the Dots card big at screen (0.30, 0.32) - S03 portals out of that point. |
| S03 Dots | 820..1750 (portal in at 0.30,0.32) | "First, OpenAI's Dots. Each dot gets its own cloud computer, links to over four thousand apps, and you can even text it on iMessage. It asks before it pays. It comes with ChatGPT Pro, from a hundred dollars a month, and it's not in Europe yet." | 'Dots studio', pastel pink/lilac: Iggy pops out of the card; cloud desktop window; DrumCounter 4,000+ with app logo tiles rippling; phone with iMessage bubble; Face ID approval sheet; '$100+/mo · ChatGPT Pro' stamp; 'Not in EU / UK yet' chip; Alfred/Todd/Jojo peek as accents; OpenAI wordmark + dots ring. Optional proof: the official slide on a glass panel. |
| S04 Muse | 1750..2637 (push) | "Meta's Muse is the everyday helper. It books trips, shops, even negotiates your bills, right inside WhatsApp, and checks with you before it spends. Most tasks are free, with twenty and hundred dollar plans. For now, it's only in the US and Singapore." | 'Muse day', Meta blue + warm: the Muse creature waves; Muse 'm' icon + Meta logo; WhatsApp chat bubbles ('Book a weekend trip', 'Find me sneakers', 'Lower my phone bill'); bill slashed on 'negotiates'; 'Approve purchase?' sheet on 'spends'; FREE · $20 · $100 chips; globe with US + Singapore pins. |
| S05 Grok Bot | 2637..3381 (push) | "xAI's Grok Bot is the team player. Every bot gets its own computer, signs into your work apps, and joins your Slack, even your Zoom calls. It comes with X Premium at thirty dollars and up, and heavy use costs extra." | 'Bot office', dark graphite + bot colours: the nine bots bounce into a row under the Grok Bot logo + xAI logo; each hops onto its own little computer; login fields fill; team chat thread with human + bot avatars (generic people avatars as simple shapes); video-call grid, a bot tile joins; price card 'X Premium $30 · Super $100 · Ultra $200'; weekly usage meter fills, 'top-up' chip. |
| S06 Claude Duet | 3381..4386 (push) | "Anthropic's Claude Duet is the careful one. It briefs you every morning, spots unpaid invoices, even runs payroll. Before it sends, pays, signs or deletes, it shows you and waits, and it never moves money between accounts. It's included in Claude Pro at twenty dollars, but it's a US waitlist preview." | 'Duet desk', warm cream/terracotta at sunrise: Duet app icon + Claude logo; phone 'Morning brief' with 3 items; invoice card UNPAID (Stripe/QuickBooks logos); Gusto payroll card; approval sheet whose 4 icons light one per word (send, pay, sign, delete) then 'Approve?' waits; red stamp 'Never moves money between accounts'; chip 'Included in Claude Pro $20 · US waitlist preview'. END STATE: key element centred at screen (0.50, 0.62) - S07 portals out of it. |
| S07 OpenClaw | 4386..5207 (portal in at 0.50,0.62) | "Now the free ones. OpenClaw, the lobster, has three hundred ninety-five thousand GitHub stars. It runs on your own computer, you chat with it on WhatsApp or Telegram, and the software costs nothing. But it can run commands on your machine, so lock it down." | 'Lobster lab', deep red/black desk at night: the lobster scuttles onto a laptop; REAL GitHub header screenshot with the Star box highlighted + DrumCounter to 395,174; WhatsApp/Telegram/iMessage/Discord bubbles fly into the laptop; badge 'MIT · FREE · no paid tier'; 'commands' -> terminal with warning stripe 'sandbox OFF by default'; 'lock it down' -> padlock snaps shut. |
| S08 Hermes | 5207..6024 (push) | "Hermes, from Nous Research, is the learner. After a hard task, it writes itself a new skill, so it gets better the more you use it. It's free with any AI model, or hosted from twenty dollars a month. The catch: you pick and set up the model yourself." | 'Hermes atelier', Nous electric blue + silver: hero line-art glows, wing logo; task card ticks 'done' -> a 'skill' leaf sprouts on a glowing skill tree, leaves multiply on 'better'; REAL GitHub header (Star 266k highlighted); model chips plug in (OpenRouter, Ollama logos, 'your own endpoint'); FREE (MIT) · cloud from $20; on 'catch' a setup checklist. END STATE: key element centred (0.5, 0.5) for the iris into S09. |
| S09 picks | 6024..6863 (iris in at 0.5,0.5) | "So which one? Busy pro with budget: Dots. Everyday errands: Muse. A whole team: Grok Bot. Approval on every risky step: Claude Duet. Free and on your own machine: OpenClaw or Hermes." | 'Pick board': the six AgentCards in a grid with the AGENTS data (price · runs on · asks first) as clean rows; each spoken pick lights its card and pops its mascot forward with the label (Busy pro -> Dots ...). END STATE: centred (0.5, 0.5) for the portal into S10. |
| S10 CTA | 6863..7244 (portal in at 0.5,0.5) | "Save this before you pay for an agent. Which one would you trust with your inbox? Tell me below." | Loop to the hook: cards fly back into the opening wall; a phone in the middle, a fingertip presses Save (bookmark fills); comment bubble 'Which one would you trust?' with the six mascots as reaction chips. No handle. |

## Rules
- Pure functions of `t`: no Math.random (sin-hash seeds), no side-effect hooks (SvgImg's loader is the exception,
  already handled), no CSS animation, no timers. TypeScript strict must pass. Unique SVG ids (prefix with scene id).
- Safe area: the engine lifts + zooms worlds out (focusY 0.50, zoom 0.82) - in YOUR stills keep text, numbers, hero
  objects and mascots between 26 % and 84 % of the frame height (captions own 15-24 %, the bottom 15 % carries the
  app's username/description); avoid key text in the right 14 % below the middle (like/comment/share buttons).
- Text on screen >= 30 px tall on the 1080 frame (labels), numbers/titles 60 px+. English, sentence case.
- Each world is a DIFFERENT PLACE (colour mood, environment) in the same premium art direction.
- Performance: a frame must render well under a second - a few hundred SVG elements, at most 1-2 small blur
  filters, images reused (don't stack dozens of full-size screenshots).
- Seams: see END STATEs above. A `push` needs nothing special.

## Your sandbox (only yours)
- `D:\VideoBlueprint\remakes\sbx-<x>\` - full engine copy (node_modules/public are shared junctions); registry has
  only `six-agents`. Write ONLY your own world file(s) in `projects/six-agents/worlds/` (names below), keep the
  export name (scenes.tsx imports it). Other world files there are placeholders - leave them. Extra files you add
  must start with your prefix.
- Type-check: `npx.cmd tsc --noEmit -p .` in the sandbox folder.
- Still: `npx.cmd remotion still src/index.ts six-agents out/<name>.png --frame=<F> --scale=0.5`. Render 8-12 stills
  per scene across its timeline (after key words, mid camera moves, first and last frame) - LOOK at them (Read the
  png), fix what is weak, iterate at least twice. Contact sheet: `magick montage out/<prefix>*.png -tile 6x
  -geometry 270x480+4+4 out/<prefix>_sheet.jpg`.
- Motion check (short, low-res, muted): `npx.cmd remotion render src/index.ts six-agents out/<prefix>_motion.mp4
  --frames=<from>-<to> --scale=0.4 --muted`, then `ffmpeg -v error -y -i out/<prefix>_motion.mp4 -vf
  fps=6,scale=216:-1,tile=8x3 -frames:v 1 out/<prefix>_strip.jpg`; check motion is smooth.
- Do NOT run full video renders, do not touch other sandboxes or `D:\VideoBlueprint\remakes\engine`.

## Report back (short)
Files written, anchors/aliases per scene, what animates on which words, final contact sheet + motion strip paths,
anything you could not get right.
