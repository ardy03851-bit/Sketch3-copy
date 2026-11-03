#!/usr/bin/env python3
"""Draw the Inkbrawl app icon: a hand-inked splat on paper, in the game's own style."""
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps

random.seed(20260103)
S = 2048  # supersampled master
INK = (31, 28, 36, 255)
PAPER = (236, 227, 209, 255)
RED = (217, 87, 59, 255)
RED_DARK = (178, 62, 40, 255)

def smooth_noise_polar(n, base, amp, seed):
    """radius per angle, wobbling like a hand-drawn line"""
    rnd = random.Random(seed)
    layers = []
    for f in (2, 3, 5, 7):
        phases = [rnd.uniform(0, math.tau) for _ in range(f)]
        layer = []
        for i in range(n):
            a = i / n * math.tau
            layer.append(sum(math.sin(f * k * a + phases[k]) / (k + 1) for k in range(f)) / f)
        layers.append(layer)
    return [base + amp * sum(l[i] for l in layers) for i in range(n)]

def blob_points(cx, cy, radii, rot=0.0, squash=1.0):
    n = len(radii)
    pts = []
    for i, r in enumerate(radii):
        a = i / n * math.tau + rot
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r * squash))
    return pts

img = Image.new('RGBA', (S, S), PAPER)

# --- paper grain + gentle vignette -------------------------------------
noise = Image.effect_noise((S, S), 22).convert('L').point(lambda p: 118 + p // 6).convert('RGBA')
img = Image.blend(img, noise, 0.10)
vig = Image.new('L', (S, S), 0)
dv = ImageDraw.Draw(vig)
dv.ellipse((-S * .25, -S * .25, S * 1.25, S * 1.25), fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(180))
shade = Image.new('RGBA', (S, S), (120, 100, 70, 255))
img = Image.composite(img, Image.blend(img, shade, 0.16), vig.point(lambda p: 255 - p))

# pencil hatch in the corners, very faint
hatch = Image.new('RGBA', (S, S), (0, 0, 0, 0))
dh = ImageDraw.Draw(hatch)
for x in range(-S, S * 2, 26):
    dh.line([(x, 0), (x + S, S)], fill=(60, 50, 40, 14), width=3)
img = Image.alpha_composite(img, hatch)

d = ImageDraw.Draw(img)
cx, cy = S * .5, S * .52

# --- the splat ----------------------------------------------------------
R = S * .335
radii = smooth_noise_polar(220, R, R * .14, 7)
# fling some pointy tails off the splat so it reads as ink, not a meatball
rnd2 = random.Random(99)
for k in range(6):
    c = rnd2.randint(0, 219)
    ln = R * (0.22 + rnd2.random() * 0.30)
    for i in range(-9, 10):
        j = (c + i) % 220
        radii[j] += ln * (1 - abs(i) / 10) ** 1.6

# ink shadow offset behind the splat (misregistered print look)
d.polygon(blob_points(cx + 14, cy + 20, [r + 10 for r in radii], rot=.35), fill=(31, 28, 36, 60))

# thick ink outline (blob drawn oversized in ink, red blob on top)
d.polygon(blob_points(cx, cy, [r + 26 for r in radii], rot=.35), fill=INK)
d.polygon(blob_points(cx, cy, [r + 15 for r in radii], rot=.35, squash=1.0), fill=RED)

# a hand-inked second stroke: slightly offset ring, sketchy double line
ring = blob_points(cx, cy, [r + 30 for r in radii], rot=.35)
d.line(ring + [ring[0]], fill=INK, width=14, joint='curve')

# darker red underside (crayon shading feel)
shade_pts = blob_points(cx, cy + R * .28, [r * .92 for r in radii], rot=.35)
d.polygon(shade_pts, fill=RED_DARK)
# redraw main body clipped from above: simpler — re-fill the top part
top_pts = blob_points(cx, cy - R * .12, [r * .96 for r in radii], rot=.35)
d.polygon(top_pts, fill=RED)

# satellite droplets (ink flicked off the splat)
for (dx, dy, r, rot) in [(-.30, -.40, .085, 1.2), (.38, -.34, .06, 2.4), (.44, .18, .045, .8), (-.36, .30, .05, 4.0)]:
    px, py, pr = cx + dx * S, cy + dy * S, r * S
    rr2 = smooth_noise_polar(40, pr, pr * .3, int(rot * 100))
    d.polygon(blob_points(px, py, [v + 13 for v in rr2], rot=rot), fill=INK)
    d.polygon(blob_points(px, py, rr2, rot=rot), fill=RED)

# --- face ---------------------------------------------------------------
ew, eh = S * .085, S * .115   # eye size
ex = S * .115                 # eye offset from centre
ey = -S * .075                # eye height
d.ellipse((cx - ex - ew, cy + ey - eh, cx - ex + ew, cy + ey + eh), fill=(255, 250, 238, 255), outline=INK, width=18)
d.ellipse((cx + ex - ew, cy + ey - eh, cx + ex + ew, cy + ey + eh), fill=(255, 250, 238, 255), outline=INK, width=18)
# pupils, glancing up-left like the menu art
pr = S * .036
for sx in (-ex, ex):
    d.ellipse((cx + sx - pr, cy + ey - pr * 1.3, cx + sx + pr, cy + ey + pr * .7), fill=INK)
    d.ellipse((cx + sx - pr * .45, cy + ey - pr * 1.5, cx + sx - pr * .05, cy + ey - pr * 1.1), fill=(255, 255, 255, 230))
# brows: two confident wobbly strokes
for sx, tilt in ((-ex, -.28), (ex, .28)):
    x0, y0 = cx + sx - S * .07, cy + ey - S * .135
    x1, y1 = cx + sx + S * .07, cy + ey - S * .155
    midx, midy = (x0 + x1) / 2 + S * .008, (y0 + y1) / 2 + S * .012
    d.line([(x0, y0), (midx, midy), (x1, y1)], fill=INK, width=int(S * .026), joint='curve')
# smirk
d.arc((cx - S * .13, cy + S * .04, cx + S * .13, cy + S * .17), start=18, end=150, fill=INK, width=int(S * .030))

# --- corner tape doodle (paper-craft feel) -----------------------------
tape = Image.new('RGBA', (S, S), (0, 0, 0, 0))
dt = ImageDraw.Draw(tape)
tw, th = S * .17, S * .062
for (tx, ty, rot) in [(S * .105, S * .085, -0.5), (S * .895, S * .915, -0.5)]:
    p = [(tx - tw, ty - th), (tx + tw, ty - th * .7), (tx + tw, ty + th), (tx - tw, ty + th * .3)]
    c, s = math.cos(rot), math.sin(rot)
    p = [(tx + (x - tx) * c - (y - ty) * s, ty + (x - tx) * s + (y - ty) * c) for x, y in p]
    dt.polygon(p, fill=(233, 222, 196, 235), outline=INK)
    dt.line(p + [p[0]], fill=INK, width=10)
img = Image.alpha_composite(img, tape)

def save(name, size, maskable=False):
    out = img.resize((size, size), Image.LANCZOS)
    if maskable:
        # keep the art inside the safe zone: shrink onto the paper colour
        bgc = Image.new('RGBA', (size, size), PAPER)
        inner = int(size * .78)
        out2 = out.resize((inner, inner), Image.LANCZOS)
        bgc.paste(out2, ((size - inner) // 2, (size - inner) // 2), out2)
        out = bgc
    out.convert('RGB').save(name, 'PNG', optimize=True)

save('icon-512.png', 512)
save('icon-192.png', 192)
save('icon-maskable-512.png', 512, maskable=True)
save('apple-touch-icon.png', 180)
print('icons written')
