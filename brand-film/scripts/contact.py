# Builds a contact sheet from rendered stills: python3 scripts/contact.py out.jpg a.jpg b.jpg ...
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w = 360 if ims[0].height > ims[0].width else 640
ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
cols = min(len(ims), 4 if w == 360 else 3)
rows = (len(ims) + cols - 1) // cols
H = max(i.height for i in ims)
sheet = Image.new('RGB', (cols * w + (cols + 1) * 6, rows * (H + 24) + 6), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for k, (im, f) in enumerate(zip(ims, files)):
    x = 6 + (k % cols) * (w + 6); y = 6 + (k // cols) * (H + 24)
    sheet.paste(im, (x, y + 18)); d.text((x, y + 2), f.split('/')[-1], fill=(220, 220, 220))
sheet.save(out, quality=90)
