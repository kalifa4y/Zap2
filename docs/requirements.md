# Requirements Specification — SnapCut

## 1. Requirements Overview
Ce document formalise les spécifications fonctionnelles, techniques et comportementales de **SnapCut**, application web locale de découpe intelligente de vidéos longues en clips courts verticaux (Shorts / Reels) avec publication sociale directe.

---

## 2. Actors & System Boundaries
* **Créateur de Contenu (Utilisateur Humain) :** Importe les fichiers vidéo, configure les paramètres de découpe, édite les métadonnées des clips générés, connecte ses comptes réseaux sociaux et déclenche les publications.
* **Moteur Backend Local (FastAPI / Workers) :** Exécute les tâches lourdes asynchrones (FFmpeg, Faster-Whisper, OpenCV), gère la base de données locale SQLite et communique avec les APIs externes.
* **YouTube Data API v3 (Système Externe) :** Reçoit les requêtes OAuth2 et les uploads vidéo (`videos.insert`) sous le format Shorts.
* **TikTok Content Posting API (Système Externe) :** Reçoit les autorisations OAuth2 et les vidéos pour publication TikTok.
* **Instagram Graph API (Système Externe) :** Reçoit les tokens Facebook/Instagram et publie les Reels via le conteneur média (`/media` puis `/media_publish`).

---

## 3. System Capabilities
* **CAP-01 :** Ingestion et analyse des métadonnées de vidéos brutes locales.
* **CAP-02 :** Détection et découpe automatique des silences basée sur des seuils acoustiques configurables.
* **CAP-03 :** Transcription vocale locale avec horodatage mot à mot et détection/suppression des tics de langage ("euh", "hum").
* **CAP-04 :** Découpage intelligent en clips cohérents de 30s à 60s et rendu 1080x1920 (9:16) avec arrière-plan flouté esthétique.
* **CAP-05 :** Studio de prévisualisation avec lecteur vidéo, édition fine des timecodes et saisie des métadonnées (titres, descriptions, tags).
* **CAP-06 :** Gestion de l'authentification OAuth2 multi-plateformes et stockage sécurisé des jetons d'accès.
* **CAP-07 :** Publication multi-plateformes (YouTube, TikTok, Instagram) avec suivi de statut en direct.

---

## 4. Functional Requirements

### Module A : Ingestion & Pipeline Audio/Vidéo
* **FR-001 (Must) :** Le système doit permettre à l'utilisateur de sélectionner ou téléverser un fichier vidéo local aux formats `.mp4`, `.mov`, `.mkv` ou `.webm`.
* **FR-002 (Must) :** Le système doit extraire les métadonnées du fichier (durée, résolution, framerate, codec, pistes audio).
* **FR-003 (Must) :** Le système doit exécuter un filtre FFmpeg `silencedetect` avec seuil de bruit (ex: `-30dB`) et durée minimale de silence (ex: `0.5s`) paramétrables pour détecter les plages muettes.
* **FR-004 (Must) :** Le système doit extraire la piste audio et exécuter `faster-whisper` (modèle configurable, ex: `base`, `small`) pour transcrire les paroles avec timestamps au mot.
* **FR-005 (Must) :** Le système doit identifier les tics verbaux configurés (ex: "euh", "hum", "uh", "um", pauses hésitantes) et les marquer pour excision.
* **FR-006 (Must) :** Le système doit segmenter la vidéo nettoyée en clips verticaux de durée cible paramétrable (défaut 30s à 60s).
* **FR-007 (Must) :** Le système doit encoder les clips générés en résolution 1080x1920 (9:16) en appliquant un arrière-plan flouté (copie agrandie et floutée du flux vidéo) sur lequel est superposé le flux vidéo original centré.

### Module B : Studio & Édition
* **FR-008 (Must) :** Le système doit afficher la liste des clips générés sous forme de grille interactive avec miniature et durée.
* **FR-009 (Must) :** Le système doit intégrer un lecteur vidéo HTML5 permettant de lire chaque clip en temps réel.
* **FR-010 (Must) :** Le système doit permettre d'ajuster les bornes temporelles de début et de fin d'un clip (+/- 0.5s à 5s) et de relancer le ré-encodage rapide du clip si modifié.
* **FR-011 (Must) :** Le système doit fournir un formulaire par clip pour éditer le Titre, la Description et les Hashtags associés.
* **FR-012 (Should) :** Le système doit permettre de télécharger le fichier vidéo final découpé directement sur le disque local.

### Module C : OAuth2 & Publication Sociale
* **FR-013 (Must) :** Le système doit permettre de connecter et déconnecter un compte YouTube (Google OAuth2 avec scope `https://www.googleapis.com/auth/youtube.upload`).
* **FR-014 (Must) :** Le système doit permettre de connecter et déconnecter un compte TikTok (TikTok OAuth2 avec scope de posting de vidéo).
* **FR-015 (Must) :** Le système doit permettre de connecter et déconnecter un compte Instagram (Instagram Graph API / Facebook Login).
* **FR-016 (Must) :** Le système doit stocker de façon sécurisée les tokens d'accès et de rafraîchissement dans la base SQLite locale.
* **FR-017 (Must) :** Le système doit rafraîchir automatiquement les jetons expirés avant toute tentative de publication.
* **FR-018 (Must) :** Le système doit permettre de sélectionner une ou plusieurs plateformes cibles et déclencher la publication d'un clip avec ses métadonnées.
* **FR-019 (Must) :** Le système doit notifier en temps réel l'état d'avancement de la publication (`PENDING`, `UPLOADING`, `PUBLISHED`, `FAILED`) avec message d'erreur détaillé en cas d'échec.

---

## 5. User Stories & Acceptance Criteria

### US-01 : Import et Lancement du Traitement
* **En tant que** créateur de contenu,
* **Je veux** charger l'enregistrement d'un live de 1h et lancer le découpage automatique,
* **Afin de** générer sans effort une sélection de Shorts optimisés.
* **Critères d'acceptation (AC-01) :**
  * *Given* un fichier vidéo valide (.mp4 de 500 Mo)
  * *When* l'utilisateur dépose le fichier et clique sur "Analyser et découper"
  * *Then* une tâche asynchrone est créée avec un identifiant unique, et l'interface affiche une barre de progression en temps réel (extraction audio -> détection silences -> transcription whisper -> découpe & rendu 9:16).

### US-02 : Studio de Prévisualisation et Métadonnées
* **En tant que** créateur de contenu,
* **Je veux** regarder chaque extrait généré et ajuster son titre et ses hashtags,
* **Afin de** peaufiner le contenu avant sa mise en ligne.
* **Critères d'acceptation (AC-02) :**
  * *Given* une liste de clips extraits
  * *When* l'utilisateur clique sur un clip
  * *Then* le lecteur vidéo 9:16 démarre immédiatement la lecture du clip et les champs Titre/Description/Hashtags sont éditables et sauvegardés instantanément.

### US-03 : Connexion de Compte et Publication Multi-Plateforme
* **En tant que** créateur de contenu,
* **Je veux** publier un clip validé sur YouTube Shorts et TikTok en un clic,
* **Afin d'** éviter les manipulations manuelles répétitives sur chaque plateforme.
* **Critères d'acceptation (AC-03) :**
  * *Given* un compte YouTube connecté et un clip sélectionné
  * *When* l'utilisateur clique sur "Publier sur YouTube Shorts"
  * *Then* le statut passe à "En cours d'upload", la vidéo est envoyée via l'API YouTube avec les balises `#Shorts`, et le statut final "Publié avec succès" s'affiche avec le lien de la vidéo.

---

## 6. Business Rules
* **BR-001 (Durée des Shorts) :** Tout clip destiné aux Shorts/Reels/TikTok doit avoir une durée comprise entre 5 secondes et 60 secondes (recommandé : 30s à 55s).
* **BR-002 (Format Vidéo) :** La résolution de sortie doit être strictement 1080x1920 pixels, profil H.264 / AAC, 30 ou 60 fps.
* **BR-003 (Gestion de Silence) :** Un silence est défini par défaut comme toute portion audio sous `-30 dBFS` pendant au moins `0.5 seconde`.
* **BR-004 (Persistance des Tokens) :** Un token expiré doit être renouvelé via son `refresh_token`. Si le renouvellement échoue (révocation), le statut du compte passe à `EXPIRED` et l'utilisateur est invité à se reconnecter.

---

## 7. Lifecycle & State Machine

### État du Projet Vidéo (Project State)
```text
UPLOADED → PROCESSING (Audio Extract → Silence Detect → Whisper Transcribe → Cutting/Rendering) → COMPLETED (or FAILED)
```

### État d'un Clip (Clip State)
```text
DRAFT → READY_TO_PUBLISH → PUBLISHING → PUBLISHED (or PUBLISH_ERROR)
```

### État d'un Compte Social (Social Account State)
```text
DISCONNECTED → CONNECTED → EXPIRED → ERROR
```

---

## 8. Data Requirements
* **Project Entity :** ID, nom original du fichier, chemin source, durée totale, résolution d'origine, statut, progression (0-100%), date de création.
* **Clip Entity :** ID, project_id, titre, description, hashtags, start_time, end_time, durée, chemin du fichier 9:16 exporté, statut, date de création.
* **SocialAccount Entity :** ID, plateforme (youtube, tiktok, instagram), account_name, account_id, access_token, refresh_token, token_expires_at, is_active, created_at, updated_at.
* **PublishJob Entity :** ID, clip_id, platform, external_video_id, status (PENDING, UPLOADING, PUBLISHED, FAILED), error_message, published_at.

---

## 9. Non-Functional Requirements
* **NFR-01 (Performance) :** L'API doit répondre aux requêtes d'état de l'UI en moins de 100ms pendant que le worker multimédia tourne en arrière-plan.
* **NFR-02 (Robustesse & Erreurs) :** La corruption d'une image ou l'échec de publication sur une plateforme ne doit pas bloquer la publication sur les autres plateformes sélectionnées.
* **NFR-03 (Compatibilité Locale) :** L'application doit fonctionner de manière autonome sur Windows 10/11 sans dépendance cloud payante obligatoire.
* **NFR-04 (UI/UX Moderne) :** L'interface doit adopter un design Studio Dark Mode professionnel, fluide et réactif, avec retours visuels immédiats (spinners, toasts, barres de progression).

---

## 10. Status & Traceability
* **Requirements Status :** READY & APPROVED FOR TECHNICAL ARCHITECTURE
* **Next Phase :** 03 — technical-research
