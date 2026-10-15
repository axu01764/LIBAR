"""Pack Cycles output into device-specific, CDN-friendly WebP sequences."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'render-output' / 'v2'
dest = ROOT / 'images' / 'hero-sequence' / 'v2'
for device in ['desktop', 'mobile']:
    (dest / device).mkdir(parents=True, exist_ok=True)
for i in range(120):
    with Image.open(source / f'frame-{i:03d}.png') as image:
        image.save(dest / 'desktop' / f'{i:03d}.webp', quality=88, method=6)
        if i == 0:
            image.save(dest / 'poster.webp', quality=88, method=6)
for i in range(120):
    original = i
    with Image.open(source / f'frame-{original:03d}.png') as image:
        # Match the mobile poster framing exactly; retain the full glass and pick.
        image = image.resize((864, 600), Image.Resampling.LANCZOS)
        image.save(dest / 'mobile' / f'{i:03d}.webp', quality=86, method=6)
        if i == 0:
            image.save(dest / 'poster-mobile.webp', quality=88, method=6)
manifest = {'renderer': 'Blender 4.5 Cycles', 'rotationDegrees': 180,
            'desktop': {'frames': 120, 'width': 1440, 'height': 1000},
            'mobile': {'frames': 120, 'width': 864, 'height': 600}}
(dest / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
for device in ['desktop', 'mobile']:
    size = sum(p.stat().st_size for p in (dest / device).glob('*.webp'))
    print(f'{device}: {size / 1024 / 1024:.2f} MiB')
