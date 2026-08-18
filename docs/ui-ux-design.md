# UI/UX Design Specification — SnapCut

## 1. Design System & Aesthetics (Dark Studio UI)
* **Palette :**
  - Arrière-plans : `bg-zinc-950` (Fond principal), `bg-zinc-900/90` (Cartes & Panneaux Studio), `bg-zinc-800/60` (Surfaces interactives)
  - Bordures : `border-zinc-800/80`, `border-indigo-500/30`
  - Typographie : `text-zinc-100` (Titres), `text-zinc-400` (Corps), `text-zinc-500` (Métadonnées & timecodes)
  - Accents primaires : Gradient `from-indigo-500 to-violet-600` (Boutons d'action, sélections actives, barres de progression)
  - Statuts : `emerald-400` (Succès/Publié), `amber-400` (En cours/Processing), `rose-400` (Erreur/Échec), `sky-400` (YouTube), `rose-500` (Instagram), `pink-400` (TikTok)
* **Iconographie :** Lucide React (`Scissors`, `Sparkles`, `Upload`, `Play`, `Pause`, `RotateCcw`, `Youtube`, `Instagram`, `Share2`, `Sliders`, `CheckCircle2`, `AlertCircle`).

---

## 2. Screen Hierarchy & Information Architecture

```text
SnapCut App
├── Top Navigation Bar (Logo SnapCut, Statut Système, Onglets Dashboard / Studio / Comptes)
│
├── View 1: Ingestion & Pipeline Dashboard
│   ├── Video Dropzone & File Browser (Support .mp4, .mov, .mkv)
│   ├── Metadata Overview (Durée, Résolution, FPS, Codec)
│   ├── Pipeline Settings Drawer (Seuil dB, Durée silence, Modèle Whisper, Durée Shorts)
│   └── Processing Live Card (Progression 0-100%, Étape en cours, Animation d'onde audio)
│
├── View 2: Studio de Prévisualisation & Édition 9:16
│   ├── Left Column: Grille des Shorts extraits (Badges de durée, miniatures, statut)
│   ├── Center Column: Lecteur Vidéo 9:16 Vertical Interactif
│   │   ├── Écran vidéo (Aspect 9:16 avec fond flouté)
│   │   ├── Barre de contrôle (Lecture/Pause, Répétition en boucle, Volume)
│   │   └── Timeline & Trim Controls (Ajustement fin Début/Fin +/- 0.5s)
│   └── Right Column: Formulaire SEO & Métadonnées
│       ├── Champ Titre optimisé (avec générateur d'idées/tags)
│       ├── Champ Description
│       ├── Gestionnaire de Hashtags interactif (Pills #Shorts, #Reels, #TikTok)
│       └── Bouton d'action principal "Publier ce Short"
│
└── View 3: Centre de Publication & Comptes Sociaux
    ├── Cartes de statut OAuth2 (YouTube Shorts, TikTok, Instagram Reels)
    ├── Boutons d'autorisation "Connecter le compte" / "Déconnecter"
    └── Modal de Publication Multi-Plateforme (Sélection des cibles, barre de progression)
```

---

## 3. Interaction Patterns & States

### 3.1. Lecteur Vidéo Vertical 9:16
* **Ratio d'aspect :** Strictement verrouillé à `aspect-[9/16]` avec centrage responsive et contours arrondis (`rounded-2xl`).
* **Contrôles au clavier :** Espace pour Play/Pause, Flèches Gauche/Droite pour reculer/avancer de 1 seconde.
* **Boucle automatique :** Activée par défaut pour émuler l'expérience utilisateur des flux TikTok/Shorts.

### 3.2. Formulaires & Feedback
* **Auto-sauvegarde :** La mise à jour du titre ou des hashtags sur un clip est persistée avec debounce (500ms) et notification discrète ("Enregistré").
* **Trim temporel :** Les boutons d'incrément/décrément de timecode (`-0.5s` / `+0.5s`) mettent à jour les bornes et repositionnent la tête de lecture à l'instant modifié.

---

## 4. UI Acceptance Criteria
* **AC-UI-01 :** L'UI s'affiche avec un contraste optimal (WCAG AA) en mode sombre natif.
* **AC-UI-02 :** La sélection d'un fichier vidéo affiche instantanément sa taille et sa durée.
* **AC-UI-03 :** La barre de progression reflète en temps réel les 4 étapes du backend (Audio Extract, Silence Detect, Whisper Transcribe, 9:16 Render).
* **AC-UI-04 :** Le lecteur 9:16 lit les vidéos de manière fluide sans étirement ou distorsion d'aspect.
* **AC-UI-05 :** Les boutons de connexion sociale ouvrent la fenêtre d'autorisation OAuth2 et mettent à jour le statut du compte sans rechargement de page complet.

---

## 5. Status & Next Step
* **Status :** PASS
* **Next Phase :** 10 — frontend-architecture
