# Style recipe (from Comment REPO and Ill DM you the link 📩This free GitHub repo has 100+ AI projects you can bui.mp4)

- Canvas 720x1280 @ 30 fps, 43.2 s; 15 shots, avg 2.87 s (median 3.1); transitions follow the voice.
- Transitions: {'zoom': 2, 'dissolve': 8, 'iris': 4} (median frames {'zoom': 10, 'dissolve': 8, 'iris': 8}); hard cuts: 0. iris wipes where the background flips dark<->light; dissolves inside an act
- Acts (background per shot): D D D D D D L L L L L L D L D  (dark #07090B, light #E6E7DD)
- Captions: top at 14% of height, ~46 px, word by word, each word 48 ms before it is spoken. caption line at the top centre in a light grey geometric sans (Inter/SF-like), one keyword per line highlighted: either bold black, or italic serif set inside a blue text-selection box with corner handles (Figma-style selection) - e.g. 'free', 'resume', 'evals', 'researches', 'DMs'
- Voice: en at 159.8 wpm, mid register. conversational, confident creator voice at a brisk 160 wpm; mid register (~149 Hz), lifts on keywords (free, called, Awesome, every, team, multi-agent, don't); short pauses between list items (manual/heuristic) (manual/heuristic)
- Music: 100.0 BPM, C minor (estimate, r=0.375), bed at 0.735x the voice level.
- SFX: 25 hits (5.78 per 10 s) {'ding': 12, 'click': 3, 'riser': 7, 'impact': 2, 'whoosh': 1}; 50% of transitions carry one, median -253 ms vs the transition.

## Narrative (share of length)

- **hook** 14%: promise: free GitHub repo, 100+ AI projects you can build and put on your resume
- **social proof** 8%: 143K GitHub stars counter
- **reveal** 20%: name the repo (awesome-llm-apps), full code, categories: agents, RAG, voice agents, MCP
- **example** 34%: favourite project walkthrough: AI Legal Agent Team (upload contract -> agents research, review, flag risks) -> what it teaches
- **advice** 16%: don't just clone: plug in your use case, add evals, deploy -> interviews
- **cta** 7%: comment REPO, get the link by DM (shown as a mock comment + DM notification)

## Look

{
  "look": "clean product-UI mock-ups floating on a soft vignette; act 1 on near-black (#07090B) with a faint dot grid, acts 2-3 on warm off-white (#E6E7DD), back to black for the CTA; heavy use of gaussian blur for depth and transitions",
  "typography_system": "caption line at the top centre in a light grey geometric sans (Inter/SF-like), one keyword per line highlighted: either bold black, or italic serif set inside a blue text-selection box with corner handles (Figma-style selection) - e.g. 'free', 'resume', 'evals', 'researches', 'DMs'",
  "colour_story": "monochrome base (black act, then paper-white act) with one accent per moment: GitHub green FREE tag, gold star/chart line, coral/red agent icons, blue selection highlight",
  "brand_marks": "@princegupta.ai handle centred near the bottom on every shot"
}

## Measured rules

- 2/14 cuts land within ±40 ms of a beat
- median |cut - nearest beat| = 103 ms
- 7/14 cuts carry an SFX hit; median SFX offset -253 ms vs the cut
- on-screen words appear 48 ms before the spoken word (median of 108 matches)
- average shot 2.87 s (median 3.10, min 0.63, max 5.87) over 15 shots