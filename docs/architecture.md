# System Architecture — SnapCut

## 1. Architecture Overview
**SnapCut** est structuré comme une application hybride locale à couplage lâche, composée d'une **Single Page Application (SPA) réactive** en frontend et d'un **Serveur d'API & Moteur Multimédia Local** en backend.

```mermaid
flowchart TD
    User([Créateur de contenu]) <--> FrontendSPA[Frontend React / Vite / TypeScript / Tailwind]
    
    subgraph LocalMachine [Machine Locale Utilisateur]
        FrontendSPA <-- HTTP REST / SSE --> BackendAPI[FastAPI REST API Server]
        
        subgraph BackendCore [SnapCut Backend Engine]
            BackendAPI --> TaskQueue[Async Task Manager / ThreadPoolExecutor]
            BackendAPI --> DB[(SQLite Database: snapcut.db)]
            
            TaskQueue --> VideoService[Video Processor: FFmpeg Pipeline]
            TaskQueue --> SpeechService[Speech Analyzer: Faster-Whisper]
            TaskQueue --> SocialService[Social Publisher: OAuth2 & Uploader]
            
            VideoService --> LocalStorage[(Local Storage: uploads / exports / temp)]
        end
    end
    
    subgraph ExternalAPIs [Plateformes Sociales Cloud]
        SocialService -- OAuth2 & Video Insert --> YouTubeAPI[YouTube Data API v3]
        SocialService -- OAuth2 & Direct Post --> TikTokAPI[TikTok Content Posting API]
        SocialService -- OAuth2 & Reels Publish --> InstagramAPI[Instagram Graph API]
    end
```

---

## 2. Architectural Drivers & Principles
1. **Zéro friction & Exécution 100% Locale :** L'ingestion, la transcription IA et le ré-encodage vidéo s'exécutent entièrement sur la machine de l'utilisateur sans dépendance cloud payante ni transfert de vidéos brutes vers un serveur tiers.
2. **Asynchronisme Non-Bloquant :** Les opérations de traitement vidéo (FFmpeg) et de transcription IA (Whisper) étant intensives en CPU/GPU, elles s'exécutent dans des threads dédiés (`ThreadPoolExecutor`) coordonnés par `asyncio`, permettant à l'API de répondre immédiatement aux requêtes d'état et à l'UI de rester à 60 FPS.
3. **Séparation Nette des Responsabilités :**
   - *VideoProcessor :* Métadonnées, filtres FFmpeg (`silencedetect`, composition 9:16 avec arrière-plan flou).
   - *SpeechAnalyzer :* Extraction audio WAV 16kHz, inférence Faster-Whisper, horodatage au mot, filtrage des hésitations verbales.
   - *SocialPublisher :* Gestion des tokens OAuth2 (YouTube, TikTok, Instagram) et protocoles d'upload résumables.

---

## 3. Major Components & Responsibilities

### 3.1. Frontend SPA (Client Layer)
* **Dashboard & Ingestion :** Zone de glisser-déposer de fichiers vidéo locaux avec sélecteurs de seuils acoustiques (dB, durée de silence) et choix du modèle Whisper.
* **Studio Player 9:16 :** Lecteur vidéo HTML5 interactif dédié au format vertical (1080x1920), avec contrôles de lecture, boucle, et timecodes.
* **Éditeur de Métadonnées & Ajusteur Temporel :** Formulaire réactif pour modifier le titre, la description, les hashtags et ajuster les bornes temporelles de début/fin du clip.
* **Panneau Social & Gestionnaire OAuth2 :** Visualisation des comptes connectés (YouTube, TikTok, Instagram) et déclencheur d'upload multi-plateforme avec barre de progression.

### 3.2. Backend API (FastAPI)
* **Endpoints REST `/api/v1/videos` :** Upload/sélection de fichier vidéo brut, extraction des métadonnées, streaming de fichiers vidéo locaux.
* **Endpoints REST `/api/v1/cut` :** Déclenchement du pipeline d'analyse et de découpe, consultation du statut de traitement (`status`, `progress`, `stage`), mise à jour et ré-encodage d'un clip.
* **Endpoints REST `/api/v1/auth` & `/api/v1/social` :** URLs d'autorisation OAuth2, callbacks pour YouTube, TikTok et Instagram, statut des comptes connectés, déclenchement d'upload.

### 3.3. Processing Pipeline (Multimédia & IA)
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Frontend (React)
    participant API as FastAPI Router
    participant Queue as Task Orchestrator
    participant FFmpeg as FFmpeg Service
    participant Whisper as Faster-Whisper Service
    participant DB as SQLite DB

    User->>UI: Sélectionne video.mp4 & clique "Lancer Découpage"
    UI->>API: POST /api/v1/cut/process (video_id, options)
    API->>DB: Crée Project (status=PROCESSING, progress=0%)
    API->>Queue: Enfile tâche d'analyse asynchrone
    API-->>UI: Retourne {task_id, project_id, status: "PROCESSING"}

    Queue->>FFmpeg: Étape 1: Extraction audio & détection silences (silencedetect)
    FFmpeg-->>Queue: Retourne liste des intervalles de silences
    Queue->>DB: Met à jour progress (25%, stage="Silence detection complete")

    Queue->>Whisper: Étape 2: Transcription audio & timestamps par mot
    Whisper-->>Queue: Retourne transcription & tics identifiés ("euh", "hum")
    Queue->>DB: Met à jour progress (50%, stage="Transcription complete")

    Queue->>Queue: Étape 3: Fusionne intervalles & segmente en clips (30s-60s)
    
    loop Pour chaque clip extrait
        Queue->>FFmpeg: Étape 4: Découpe + Rendu 9:16 avec background flouté
        FFmpeg-->>Queue: Fichier clip_X_9x16.mp4 généré
        Queue->>DB: Insère entité Clip (project_id, file_path, start_time, end_time)
    end

    Queue->>DB: Met à jour Project (status=COMPLETED, progress=100%)
    UI->>API: GET /api/v1/cut/projects/{id} (Polling / Query)
    API-->>UI: Retourne Project avec liste des Clips extraits
    UI->>User: Affiche les clips dans le Studio 9:16
```

---

## 4. Security & Data Persistence Boundaries
* **Base locale `snapcut.db` :** Contient la table `SocialAccount` stockant `access_token`, `refresh_token`, et date d'expiration.
* **Stockage média :**
  - `storage/uploads/` : Fichiers sources importés.
  - `storage/exports/` : Shorts 9:16 exportés.
  - `storage/temp/` : Pistes audio temporaires `.wav` nettoyées après transcription.
* **Gestion des Secrets OAuth2 :** Les variables d'environnement (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, `INSTAGRAM_APP_ID`, etc.) sont injectées via le fichier `.env` local.

---

## 5. Architectural Status
* **Status :** PASS (Coherent & Verified)
* **Next Phase :** 07 — database-design
