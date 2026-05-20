# OfflineFirst — Pitch deck & video kit

Everything you need to record the YCS submission video.

## Files

- `index.html` — the slide deck. Open in any browser, hit `F` for fullscreen.
- `script.md` — voiceover, timing, when-to-cut-to-app cues.
- `README.md` — this file. Recording workflow.

## Running the deck

```sh
open slides/index.html
```

Or just double-click it. No build step, no server, no fonts to install (Roboto + Google Sans are pulled from Google Fonts).

### Keyboard

| Key            | Action                                    |
|----------------|-------------------------------------------|
| `→` or `Space` | Next slide                                |
| `←`            | Previous slide                            |
| `1`–`8`        | Jump to slide                             |
| `F`            | Fullscreen                                |
| `N`            | Toggle speaker-notes panel (off by default) |
| `R`            | Reset the on-screen timer                 |

The timer at the bottom right targets 1:55. It turns yellow at 1:38 and red past 1:55. Use it during practice. Hide it for the real recording (the deck doesn't show it in the recording-ready view — see below).

## Recording workflow

You're cutting between two sources: **slides** (the deck) and **app** (a screen recording of OfflineFirst). Record the audio once, continuously, and lay the visuals on top in your editor.

### Gear

- **Mic:** Anything better than a laptop mic. AirPods are fine. A USB mic (Blue Yeti, Samson Q2U) is better.
- **Screen recorder:** macOS Screenshot toolbar (`Cmd+Shift+5`) is enough. OBS if you want overlays.
- **Editor:** iMovie, CapCut, DaVinci Resolve Free. Anything that can cut clips and mix audio.

### Order of operations

1. **Practice the script out loud 3–5 times.** Hit 1:55 ± 3 seconds before recording.
2. **Record the app demos first.** Two clips:
   - `demo-1.mov` — slide 4 sequence (onboarding → home → lesson → quiz → teacher dashboard). Target 30s.
   - `demo-2.mov` — slide 5 sequence (WiFi off → lesson works → second device → mesh handoff). Target 25s.
   - For demo 2, use two browser windows side-by-side, or two physical devices. Two devices looks more credible.
3. **Record the slides.** Open `index.html`, fullscreen, hit `R` to reset the timer (the timer doesn't get recorded — it's chrome). Use Screenshot toolbar → "Record Selected Portion" → frame just the deck.
4. **Record voiceover in one take.** Mic only, no video. If you flub a line, pause for 3 seconds, restart that sentence — easier to cut in editing.
5. **Assemble in the editor:**
   - Audio track: voiceover, full length.
   - Video track 1: slide recording.
   - Video track 2: `demo-1.mov` cut in over slide 4, `demo-2.mov` cut in over slide 5.
   - Sync the cut-points to the timing in `script.md`.
6. **Export** at 1080p, 30fps, H.264. Most submission portals cap at 100MB — this will land around 30–60MB.

### Pre-flight checklist for the app demos

Before you hit record on either demo, set up the app so it looks clean:

- [ ] Clear the SQLite DB or reset to seed data — no junk lessons named "test test."
- [ ] Sign out of any teacher session so onboarding actually runs.
- [ ] Close all other tabs. Hide the bookmarks bar (`Cmd+Shift+B`).
- [ ] Enable cursor highlight: System Settings → Accessibility → Pointer → Pointer size 1.5, cursor highlight on.
- [ ] Set system to Do Not Disturb. No Slack notifications mid-demo.
- [ ] If using two devices for demo 2, pre-pair them once so the mesh badge lights up instantly when you re-open the second one.

## What we learned from past winning entries

The competition videos that score well share five traits. Optimize for these:

1. **Show the product working in the first 30 seconds.** Judges watch hundreds. If they don't see a screen by 0:30 they assume there isn't one.
2. **Real metrics, not adjectives.** "2.6 billion offline" beats "many people." "$60 hardware" beats "affordable." Every line in our script has a number or a verb.
3. **One clear demo of the differentiated thing.** For us that's slide 5 — turn off WiFi, watch the lesson hop devices. That moment is the entire pitch.
4. **No template look.** Generic Canva decks lose. The deck here matches the actual app's design language (same fonts, same blue, same card style) so the slides feel like an extension of the product, not a separate marketing layer.
5. **Under the time limit, never over.** Hard cap is 2:00. Cut to 1:55 to leave headroom for upload re-encodes that sometimes add a frame.

## Common mistakes to avoid

- **Reading the slides verbatim.** The slide and the voice should reinforce each other, not echo.
- **Saying "AI" anywhere in the pitch** unless it's actually in the product. It isn't, so don't.
- **Showing the dev tools, the terminal, the IDE.** Nothing builds skepticism faster than judges seeing your editor.
- **Cuts inside a sentence.** Always cut between sentences. The brain hears the seam.
- **Background music with vocals or drops.** It will fight the voiceover. Either silence or an unobtrusive bed.

## If something breaks during recording

- App freezes mid-demo → don't try to fix it on camera. Stop, restart the dev server, re-record that demo clip only.
- Voiceover line goes wrong → keep the recorder running, pause 3 seconds, redo the sentence. Cut the bad take in editing.
- Mesh handoff doesn't fire on cue → pre-warm by opening the second device 10 seconds before you "discover" it on camera. The connection happens off-screen, so when you "open" it in the demo, the lesson is already there.

## File sizes (sanity check)

- `index.html` is self-contained. No build needed.
- The two demo recordings should land ~10–20MB each.
- The final exported video should be 30–60MB at 1080p / 30fps / H.264. Most YCS portals accept up to 100MB.

## License & credit

OfflineFirst is a YCS 2026 student submission. The deck is plain HTML + system fonts — fork it for your own project if it's useful, no attribution needed.
