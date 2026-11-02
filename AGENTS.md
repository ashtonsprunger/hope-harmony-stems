# Project Rules & User Preferences

1. **"Fix" Audio Files Definition**: Whenever the user asks to "fix" audio files (or stems/MP3s), convert them to **48,000 Hz (48 kHz), Mono (`-ac 1`), 128 kbps (`-b:a 128k`)** MP3s using FFmpeg.
2. **Git Push Restriction**: **Never run `git push` (or deploy to production) unless the user explicitly asks to push.**
3. **Kate Logic**: whenever the user mentions "kate", you must know which kate it is and refer to them as either "Kate S." or "Kate O.". If it is unclear which kate it is, ask the user to clarify.