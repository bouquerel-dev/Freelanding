"""
Détoure le portrait couleur pris devant un mur volt et l'écrit en WebP
transparent pour le héros, avec sa petite trame (2026-11-25, refonte).

Lancement, depuis la racine du dépôt (modèle téléchargé une fois, local et
gratuit, aucune API) :

    uv run -p 3.12 --with "rembg[cpu]" --with scipy \\
      scripts/detourer-portrait.py <source.jpeg> public/images/eliott-portrait-couleur.webp \\
      public/images/eliott-portrait-trame.webp

DEUX SOURCES D'ALPHA, CHACUNE LÀ OÙ ELLE EST BONNE.

- Le modèle de segmentation (BiRefNet portrait, via rembg) sait ce qui est la
  personne : visage, chemise blanche, veste. Il ne laisse aucun trou, mais il
  arrondit les mèches.
- Le mur vert dit, pixel par pixel, combien de mur se voit à travers : sa
  « verdeur » `g - (r + b) / 2` se mélange linéairement. Une mèche qui laisse
  voir 40 % de mur a 40 % de la verdeur du mur derrière elle. Comparée au mur
  reconstitué derrière la personne, elle donne un alpha fin, mèche par mèche.

Le cœur sûr du modèle est opaque ; loin du modèle, tout est transparent ;
entre les deux (la bande des cheveux et des bords), l'alpha du mur décide.

COULEUR. Sur les bords, chaque pixel est démélangé du mur
(`F = (C - (1 - α) B) / α`) : les mèches retrouvent leur brun, sans liseré ni
halo vert, au lieu d'être rognées.
"""

import sys

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage as nd

source, sortie, trame = sys.argv[1:4]

img = Image.open(source).convert("RGB")
C = np.asarray(img, dtype=np.float32) / 255.0
H, W, _ = C.shape


def verdeur(x):
    return x[..., 1] - (x[..., 0] + x[..., 2]) / 2


# 1. Le modèle : probabilité d'appartenir à la personne.
#    `MASQUE=<png>` réutilise un masque déjà calculé (réglages sans relancer).
import os

if os.environ.get("MASQUE"):
    modele = Image.open(os.environ["MASQUE"]).convert("L").resize((W, H))
else:
    modele = remove(img, session=new_session("birefnet-portrait"), only_mask=True)
m = np.asarray(modele, dtype=np.float32) / 255.0

# 2. Le mur derrière la personne : là où le modèle est sûr du fond et le pixel
#    franchement vert, on prend la couleur, puis on la prolonge sous la
#    personne (plus proche voisin, puis lissage large : le mur est uni).
k = verdeur(C)
mur_sur = (m < 0.02) & (k > 0.2)
_, (iy, ix) = nd.distance_transform_edt(~mur_sur, return_indices=True)
B = C[iy, ix]
B = np.stack([nd.gaussian_filter(B[..., c], 12) for c in range(3)], axis=-1)
kB = np.maximum(verdeur(B), 0.1)

# 3. Alpha du mur : part de verdeur du mur qui reste visible.
a_mur = np.clip(1.0 - k / kB, 0.0, 1.0)
# Petit seuil doux : le grain du mur (±3 %) ne fait pas de voile.
a_mur = np.clip((a_mur - 0.04) / 0.92, 0.0, 1.0)

# 4. Les trois zones.
coeur = nd.binary_erosion(m > 0.95, iterations=4)
coeur = nd.binary_fill_holes(coeur)
portee = nd.binary_dilation(m > 0.03, iterations=18)
portee = nd.gaussian_filter(portee.astype(np.float32), 4)
# Au cœur, le reflet du mur sur la chemise (jusqu'à 25 % de sa verdeur) reste
# opaque ; un trou entre deux boucles, plus vert, garde l'alpha du mur.
alpha = np.where(coeur, np.clip(a_mur / 0.75, 0.0, 1.0), a_mur * portee)
alpha = np.clip(alpha, 0.0, 1.0)
# Poussières isolées dans le mur : écartées (composantes de moins de 40 px).
etiquettes, n = nd.label(alpha > 0.02)
if n:
    tailles = nd.sum(np.ones_like(alpha), etiquettes, index=np.arange(1, n + 1))
    petites = np.isin(etiquettes, np.where(tailles < 40)[0] + 1)
    alpha[petites] = 0.0

# 5. Couleur démélangée du mur sur les bords.
a3 = alpha[..., None]
F = np.where(a3 > 0.02, (C - (1.0 - a3) * B) / np.maximum(a3, 0.02), C)
F = np.clip(F, 0.0, 1.0)
# Sous 35 % d'alpha, le démélange devient bruité : on glisse vers la couleur
# des mèches voisines (moyenne pondérée par l'alpha), toujours sans vert.
poids = nd.gaussian_filter(alpha, 3) + 1e-4
voisin = np.stack([nd.gaussian_filter(F[..., c] * alpha, 3) for c in range(3)], axis=-1) / poids[..., None]
t = np.clip(alpha / 0.35, 0.0, 1.0)[..., None]
F = t * F + (1 - t) * voisin
# Dernier filet : le vert ne dépasse jamais le plus fort du rouge et du bleu.
F[..., 1] = np.minimum(F[..., 1], np.maximum(F[..., 0], F[..., 2]))

rgba = np.dstack([F, alpha])
sortie_img = Image.fromarray(np.round(rgba * 255).astype(np.uint8), "RGBA")
sortie_img.save(sortie, "WEBP", quality=88, method=6, exact=False)
# La trame : la même photo en petit, 320 px, lue en points par `VisageTrame`.
sortie_img.resize((320, 320), Image.LANCZOS).save(trame, "WEBP", quality=80, method=6)
print(f"✅ {sortie} et {trame}")
