# Implementation Plan — SnapCut

## 1. Objective
Construire l'application web locale complète **SnapCut** permettant l'import de vidéos longues (lives), la découpe automatique des silences et tics verbaux, le recadrage vertical 9:16 avec arrière-plan flouté, la prévisualisation dans un studio interactif, et la publication multi-plateforme via YouTube Data API v3, TikTok Content Posting API et Instagram Graph API.

---

## 2. Current State & Desired End State
* **Current State :** Projet neuf (Greenfield), spécifications de discovery, requirements, technical research et repository structure documentées.
* **Desired End State :** Application fonctionnelle de bout en bout avec :
  - Un backend FastAPI robuste avec persistance SQLite, pipelines FFmpeg/Whisper asynchrones et services OAuth2/Upload.
  - Un frontend React/Vite/TS/Tailwind moderne avec thème Dark Studio, lecteur vidéo interactif 9:16, timeline d'édition et panneau social.
  - Tests unitaires et d'intégration validés.

---

## 3. Execution Phases & Task Breakdown

### Phase 1 : Architecture & Design Specifications (Phases 06 à 10)
* **T-001 : Spécifications d'Architecture Système (`system-architecture`)**
  - Flux de données, architecture des workers, communication asynchrone / SSE.
* **T-002 : Modélisation Base de Données (`database-design`)**
  - Schémas SQLite / SQLAlchemy pour `Project`, `Clip`, `SocialAccount`, `PublishJob`.
* **T-003 : Spécifications des Contrats API (`api-design`)**
  - Endpoints REST `/api/v1/videos`, `/api/v1/cut`, `/api/v1/social`, `/api/v1/auth`.
* **T-004 : Spécifications UI/UX & Design System (`ui-ux-design`)**
  - Tokens visuels, hiérarchie, wireframes des écrans, interactions lecteur et formulaires.
* **T-005 : Architecture Frontend (`frontend-architecture`)**
  - Arborescence React, stores Zustand, hooks TanStack Query, gestion d'état lecteur vidéo.

---

### Phase 2 : Backend Foundation & Core Pipeline (Phase 11)
* **T-006 : Initialisation du Backend FastAPI & Base de Données**
  - `requirements.txt`, configuration Pydantic (`app/core/config.py`), sessionmaker SQLite (`app/core/database.py`), modèles ORM (`app/models/`).
* **T-007 : Service de Traitement Vidéo & Détection de Silence (FFmpeg)**
  - `app/services/video_processor.py` : extraction métadonnées, filtre `silencedetect`, découpe de segments sans recompression inutile, filtre complexe 9:16 avec arrière-plan flouté (`boxblur`).
* **T-008 : Service de Transcription & Analyse Vocale (Faster-Whisper)**
  - `app/services/speech_analyzer.py` : extraction audio WAV 16kHz mono, transcription `faster-whisper` avec timestamps mot à mot, détection des tics de langage ("euh", "hum", pauses) et calcul des intervalles utiles.
* **T-009 : Pipeline Orchestrateur de Découpe & API Endpoints**
  - `app/api/v1/endpoints/videos.py` (upload, streaming vidéo), `app/api/v1/endpoints/cut.py` (lancement de tâche, suivi de progression, ajustement de clip).
* **T-010 : Service Social & OAuth2 Multi-Plateformes**
  - `app/services/social_publisher.py` : implémentation des flux OAuth2 Google/YouTube, TikTok et Meta/Instagram, rafraîchissement des tokens et téléversement vidéo (`app/api/v1/endpoints/social.py` et `auth.py`).

---

### Phase 3 : Frontend SPA Studio & Dashboard (Phase 11)
* **T-011 : Initialisation React/Vite/TypeScript/Tailwind**
  - `package.json`, `vite.config.ts`, `tailwind.config.js`, design tokens Dark Studio, configuration TanStack Query.
* **T-012 : Composants d'Ingestion & Dashboard**
  - `VideoUploader.tsx` (glisser-déposer, options seuils dB/durée/modèle whisper), `ProcessingProgress.tsx` (barre de progression étape par étape).
* **T-013 : Composant Studio de Prévisualisation & Édition**
  - `ClipPreview.tsx`, `VideoPlayer.tsx` (lecteur 9:16, scrubbing, lecture en boucle), `TimelineAdjuster.tsx` (ajustement fin +/- début/fin), `ClipMetadataForm.tsx` (titre, hashtags, description).
* **T-014 : Panneau de Gestion Sociale & Modal de Publication**
  - `SocialAccounts.tsx` (statuts des comptes, boutons connexion OAuth2), `PublishModal.tsx` (sélection multi-réseaux, progression d'upload, feedback en direct).

---

### Phase 4 : Tests, Sécurité, Déploiement & Vérification (Phases 12 à 16)
* **T-015 : Tests Automatisés, Audit Sécurité & Vérification Locale**
  - Tests unitaires backend (pytest, mocks FFmpeg/Whisper/OAuth2), tests composants frontend, vérification des règles de sécurité (secrets, tokens, validation d'entrées).

---

## 4. Dependencies & Execution Graph
```text
T-001 (Sys Arch) ──► T-002 (DB) ──► T-003 (API) ──► T-004 (UI/UX) ──► T-005 (Frontend Arch)
                                                                             │
                                   ┌─────────────────────────────────────────┴────────────────┐
                                   ▼                                                          ▼
                            T-006 (Backend Core)                                    T-011 (Frontend Boilerplate)
                                   │                                                          │
                   ┌───────────────┴───────────────┐                                          │
                   ▼                               ▼                                          ▼
            T-007 (FFmpeg)                  T-008 (Whisper)                         T-012 (Uploader UI)
                   │                               │                                          │
                   └───────────────┬───────────────┘                                          ▼
                                   ▼                                                T-013 (Studio UI)
                            T-009 (Cut Pipeline)                                       │
                                   │                                                   ▼
                            T-010 (Social Publisher) ◄─────────────────────────────── T-014 (Social UI)
                                   │
                                   ▼
                            T-015 (Tests, Security & Verification)
```

---

## 5. Verification Checkpoints
* **Checkpoint 1 :** Spécifications complètes (Phases 06 à 10 validées).
* **Checkpoint 2 :** Backend opérationnel avec ingestion vidéo, extraction de silences FFmpeg et transcription Whisper mockable/testable.
* **Checkpoint 3 :** Rendu 9:16 exporté correctement avec arrière-plan flouté.
* **Checkpoint 4 :** Frontend fonctionnel connecté à l'API, prévisualisation fluide dans le lecteur 9:16 et gestion des métadonnées.
* **Checkpoint 5 :** Flux OAuth2 et simulation d'upload social validés.

---

## 6. Status & Next Step
* **Status :** PASS
* **Next Phase :** 06 — system-architecture
