# BF2 Consult — Site statique avec Témoignages (1500)

Site vitrine minimal pour une micro-agence (CV, Lettres, Business Plans, Candidatures).  
Compatible GitHub Pages et Vercel.

## Déploiement rapide (Vercel)
1. Créez un dépôt GitHub et uploadez ces fichiers (racine du dépôt).
2. Sur vercel.com, **New Project** → importez le repo.
3. Framework **Other** / **Static**. Build command : *(vide)*. Output dir : `/`.
4. Déployez. Ajoutez votre domaine si besoin.

## Déploiement GitHub Pages
1. Poussez sur `main`.
2. **Settings → Pages**, Source = **Deploy from a branch** → `main` / `/ (root)`.

## Témoignages
- Données : `assets/testimonials.json` (1500 avis).
- Le carrousel charge le JSON, n'affiche que quelques cartes à la fois et fait défiler en continu.
- Flèches gauche/droite pour naviguer par page, défilement auto (3s).

## Contact
- WhatsApp : +221 76 470 70 59
- Email : bf2btrading@gmail.com


## Formulaire Témoignages (LocalStorage)
- Le formulaire de la section Témoignages permet d'ajouter un avis (Nom/Prénom, Ville, Secteur, Document, Message, Note).
- Les avis ajoutés sont stockés **localement** dans le navigateur (localStorage) et s'affichent **immédiatement**.
- La **note moyenne** et le **nombre total** se mettent à jour automatiquement :
  - moyenne = (moyenne_base * nb_base + somme_notes_locales) / (nb_base + nb_local)
- Le carrousel fusionne les avis de base (`assets/testimonials.json`) avec les avis locaux.
