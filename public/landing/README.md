Drop your landing assets here:

- `loop.mp4`: the hi-res looping background video (recommended: H.264, muted)
- `poster.png` (or `poster.jpg`/`poster.gif`): lightweight preview image shown before video loads (and when video is blocked)
- `config.json`: optional overrides for `videoSrc`/`posterSrc` (useful for pointing `videoSrc` to an external URL in production)

The landing page references these paths directly:

- `/landing/loop.mp4` (fallback)
- `/landing/Loop.mp4` (fallback)
- `/landing/poster.png`
- `/landing/config.json`
