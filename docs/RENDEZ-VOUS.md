# Prise de rendez-vous : moteur du cockpit

Depuis le 2026-11-02, le bloc « Réserver un créneau » du site ne passe plus par
Cal.com. Le moteur de réservation est le cockpit d'Eliott
(`admin.eliottbouquerel.fr`) : il calcule les créneaux libres depuis Google
Agenda, pose l'événement avec un lien Meet, écrit au prospect, met la fiche
client à jour et bloque les relances de prospection. Le site garde son interface
(composant, questionnaire, anti-robot, limites) et n'a changé que de moteur.

Raison du changement : Cal.com voyait les données d'Eliott et de ses prospects,
et deux réservations Cal.com n'avaient pas atteint le cockpit (une relance
allait partir chez un prospect qui avait réservé).

## 1. Le chemin d'une réservation

```
navigateur ──> /api/rendez-vous/creneaux ──> cockpit GET  /api/rdv/creneaux
navigateur ──> /api/rendez-vous          ──> cockpit POST /api/rdv
                (origine, débit, captcha)     (Bearer RDV_TOKEN, serveur à serveur)
```

- Le navigateur ne parle qu'au site. Le jeton `RDV_TOKEN` ne quitte jamais le
  serveur du site : `src/lib/rendez-vous/cockpit.ts` n'est importé que par des
  routes et des pages serveur.
- Les types sont désignés par leur clé cockpit (`CLES_COCKPIT` dans
  `src/lib/rendez-vous/config.ts`), identique à l'identifiant du site :
  `logiciel`, `site`, `ia`, `decouverte` (bouton « Autre ») pour le PREMIER
  rendez-vous, puis `point-rapide`, `demonstration`, `proposition` et
  `point-d-etape` pour les CLIENTS en cours (`IDS_CLIENT`). Le sujet choisi part
  comme type : le titre de l'agenda, la fiche et le mail de confirmation le
  suivent au cockpit, sans autre champ.
- **TROIS ÉTAPES DEPUIS LE 2026-11-24** (pied de page et `/rdv`, même
  composant `ReservationRendezVous`) : (1) le créneau, affiché sans clic
  préalable ; (2) le sujet, écrit avec les mots du visiteur (plus de boutons
  Logiciel / Site / IA / À voir ensemble), obligatoire, 3 caractères au moins ;
  (3) nom, e-mail, téléphone. Retour arrière et « Modifier » sur le rappel du
  créneau. Le type envoyé est celui du lien (`?sujet=logiciel|site|ia|autre`,
  sans rien afficher) ou `SUJET_PAR_DEFAUT` (`decouverte`, « Premier échange »
  au cockpit). Le sujet écrit est la ligne libre décrite plus bas : il arrive au
  cockpit en `notes` et en `reponses.coince`. Le cockpit n'a rien eu à changer.
  Dans le pied de page, l'onglet « Réserver un appel » est ouvert par défaut, et
  les créneaux ne se chargent qu'à l'approche du bloc (800 px), pour ne pas
  interroger l'agenda à chaque page vue.
  Le calendrier enchaîne sur le mois suivant (second appel `mois=`, son 1er
  porte le nom du mois). Créneaux : débuts tous les quarts d'heure
  (`PAS_MINUTES` du cockpit), durée par défaut du type (30 minutes pour le
  premier échange).
- **UN SEUL LIEN POUR LES CLIENTS : `/rdv/client`** (non indexé,
  `src/app/(site)/rdv/client/page.tsx`). Quatre boutons : Point rapide,
  Démonstration, Proposition, Point d'étape ; `?sujet=point-rapide|demonstration|
  proposition|point-d-etape` présélectionne. Seuls le nom et l'e-mail sont
  exigés, le téléphone et la ligne libre sont facultatifs (`estTypeClient`).
  `/rdv/demonstration` et `/rdv/point-d-etape` y renvoient (307). Ces quatre
  types sont `prive` : ils ne figurent jamais dans le choix de `/rdv`.
- Liens (`next.config.ts`) : `/rdv/logiciel` → `/rdv?sujet=logiciel` en 301 (il
  est dans des centaines de mails de prospection et dans les liens suivis du
  cockpit), les mails sortants du cockpit n'ont donc rien à changer.
  Destinations des clics suivis : `src/lib/clic/signature.ts`.
- La ligne libre part deux fois : en notes (`composerNotes`, téléphone en première
  ligne quand il existe, c'est ce qu'Eliott lit dans son agenda et dans
  l'historique de la fiche société), et en clair dans `reponses.coince`
  (`reponsesLisibles`), que le cockpit reprend dans le mail de confirmation en
  demandant de confirmer d'un mot. Sans ligne libre, ni notes ni réponses.
- Horizon : 60 jours (`HORIZON_JOURS`, le même qu'au cockpit). Préavis réel :
  deux heures, tenu par le cockpit ; le site ne filtre qu'à une heure.

### Ce que le site renvoie au navigateur

| Cas | Réponse du cockpit | Réponse du site |
|---|---|---|
| Réservé | 201 | 200 `{ ok: true }` |
| Créneau pris entre-temps | 409 `creneau_pris` | 409, « Ce créneau vient d'être pris », champ `creneau` |
| Jeton refusé, champs refusés | 401, 400 | 502, repli « écrivez-moi » |
| Cockpit sans `RDV_TOKEN`, agenda en panne | 503, 502 | 502, repli « écrivez-moi » |
| Cockpit injoignable, délai dépassé | aucune | 504, repli « écrivez-moi » |
| Site sans `RDV_TOKEN` | non appelé | 503, et le bloc n'est pas rendu |

Le code d'erreur du cockpit va au journal serveur (`[rendez-vous] …`), jamais au
navigateur.

## 2. Déplacer ou annuler : `/rdv/gerer/[jeton]`

Le mail de confirmation et la description de l'événement Google portent le lien
`https://eliottbouquerel.fr/rdv/gerer/<jeton>`. Le jeton (32 octets, base64url)
est la seule preuve demandée : pas de captcha, page `noindex`, sans référent,
sans nom ni e-mail affichés.

- La page lit le rendez-vous au cockpit côté serveur
  (`GET /api/rdv/gestion/[jeton]`) et montre sujet, date et heure de Paris,
  durée. États : à venir (actions), annulé, déplacé (ancien lien), passé (dès
  l'heure de début), lien inconnu, cockpit injoignable.
- **Annuler** : motif facultatif (1 000 caractères au plus), puis
  `POST /api/rendez-vous/gestion/[jeton]/annuler` → cockpit
  `POST /api/rdv/gestion/[jeton]/annuler`.
- **Déplacer** : le calendrier et la colonne des heures du formulaire
  (`Calendrier`, `Heures`, exportés de `ReservationRendezVous.tsx`), nourris par
  `GET /api/rendez-vous/gestion/[jeton]/creneaux` au type et à la durée du
  rendez-vous, puis `POST /api/rendez-vous/gestion/[jeton]/deplacer`. Le
  cockpit rend un jeton neuf : la page remplace son adresse par le nouveau lien.
- Protections des routes de gestion (`src/lib/rendez-vous/garde-gestion.ts`) :
  origine, `content-type` JSON pour les écritures, débit (6 écritures et 40
  lectures par quart d'heure et par adresse), format du jeton avant tout appel,
  503 sans `RDV_TOKEN`.

## 3. Variables d'environnement (application Coolify du site)

| Variable | Valeur | Secret |
|---|---|---|
| `RDV_TOKEN` | le même jeton que `RDV_TOKEN` du cockpit | oui |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | clef de site reCAPTCHA v3 (repli Turnstile si absente) | non |
| `RECAPTCHA_SECRET_KEY` | clef secrète reCAPTCHA v3 | oui |
| `RECAPTCHA_SEUIL` | facultatif, score minimal de 0 à 1, 0.5 par défaut | non |
| `COCKPIT_URL` | facultative, `https://admin.eliottbouquerel.fr` par défaut | non |

Sans `RDV_TOKEN`, le bloc de réservation ne se rend pas et les routes répondent
503 : c'est l'état par défaut du dépôt. `COCKPIT_URL` n'accepte `http:` que vers
la machine locale (le jeton partirait en clair). Les variables `CAL_COM_*` ne
servent plus et peuvent être retirées de Coolify.

Les variables sont lues au rendu : après les avoir posées, redéployer.

## 4. Recette, une fois les variables posées

1. `/contact`, onglet rendez-vous : le calendrier montre des créneaux, en
   semaine, à l'heure de Paris.
2. Réserver un créneau de test : l'événement apparaît dans Google Agenda avec
   le lien Meet, le mail de confirmation arrive, la fiche apparaît au cockpit.
3. Ouvrir le lien « déplacer ou annuler » du mail : déplacer, vérifier que
   l'événement Google a bougé et que l'adresse de la page a changé ; l'ancien
   lien affiche « Rendez-vous déplacé ».
4. Annuler : l'événement disparaît, la page affiche « Rendez-vous annulé ».

## 5. Où vit quoi

| Fichier | Rôle |
|---|---|
| `src/lib/rendez-vous/cockpit.ts` | client du cockpit : créneaux, durées, réservation, gestion par jeton |
| `src/lib/rendez-vous/config.ts` | `RDV_TOKEN`, `COCKPIT_URL`, clés des types, sujets d'URL |
| `src/lib/rendez-vous/gestion.ts` | états de la page, validation annuler/déplacer, traduction des refus |
| `src/lib/rendez-vous/garde-gestion.ts` | contrôles communs des routes de gestion |
| `src/app/api/rendez-vous/` | routes du formulaire et de la gestion |
| `src/app/(site)/rdv/gerer/[jeton]/page.tsx` | page de gestion |
| `src/components/rendez-vous/` | formulaire et actions de gestion |
| `src/content/rendez-vous.ts` | tous les textes, page de gestion comprise |

Côté cockpit : `src/lib/rdv/` et `src/app/api/rdv/` (spécification :
`.claude/spec-rdv-maison.md` du dépôt Cockpit).
