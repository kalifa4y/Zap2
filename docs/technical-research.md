# Technical Research Report — SnapCut

## 1. Research Objectives
Évaluer la faisabilité technique, les dépendances critiques, les pipelines de traitement multimédia et les protocoles d'intégration API pour le développement local de **SnapCut**.

---

## 2. Technical Stack Evaluation & Decisions

### 2.1. Traitement Multimédia (Audio / Vidéo)

#### A. Détection des Silences
* **Solution retenue :** FFmpeg natif via le filtre audio `silencedetect`.
* **Mécanisme :** 
  ```bash
  ffmpeg -i input.mp4 -af "silencedetect=noise=-30dB:d=0.5" -f null -
  ```
  L'analyse des logs stderr permet d'extraire les timestamps `silence_start: X` et `silence_end: Y` avec une précision à la milliseconde sans charger le fichier vidéo entier en RAM.

#### B. Transcription Vocale & Filtrage des Tics
* **Solution retenue :** `faster-whisper` (CTranslate2).
* **Justification :** 4x plus rapide que l'implémentation OpenAI Whisper standard et 2x moins gourmand en mémoire vive. Supporte l'horodatage mot à mot (`word_timestamps=True`).
* **Modèle recommandé :** `base` ou `small` avec `compute_type="int8"` sur CPU, et `compute_type="float16"` si CUDA GPU est disponible.

#### C. Recadrage 9:16 & Arrière-plan Flou (Blurred Background)
* **Solution retenue :** Filtre complexe FFmpeg (`filter_complex`) en une seule passe :
  ```text
  [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=luma_radius=20:luma_power=2[bg];
  [0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];
  [bg][fg]overlay=(W-w)/2:(H-h)/2[outv]
  ```
* **Avantage :** Évite les transferts d'images non compressées dans Python (OpenCV/NumPy), libérant le CPU et maximisant le débit d'encodage via le moteur C de FFmpeg.

---

### 2.2. Backend & Asynchronisme

* **Framework API :** FastAPI (Python 3.11+) + Uvicorn.
* **Exécution des tâches lourdes :** `asyncio` combiné à `ThreadPoolExecutor` ou `BackgroundTasks` FastAPI. Pour une application locale monoposte, cette approche élimine le besoin d'installer un broker externe lourd comme Redis/RabbitMQ, tout en maintenant l'API ultra-réactive.
* **Notifications de progression :** Polling léger via TanStack Query ou Server-Sent Events (SSE) / WebSocket pour notifier la progression fine (0% à 100%).

---

### 2.3. Base de Données & Persistance Locale

* **Moteur :** SQLite via SQLAlchemy 2.0.
* **Avantages :** 
  * Fichier unique local `snapcut.db`.
  * Zéro installation de serveur de base de données pour l'utilisateur.
  * Support transactionnel complet et typage avec Pydantic / SQLModel / SQLAlchemy ORM.

---

### 2.4. Frontend SPA

* **Technologies :** React 18, Vite.js, TypeScript.
* **CSS & Design :** Tailwind CSS avec thème Dark Studio personnalisé (gris anthracite, accents indigo/violet, glassmorphism).
* **Icônes :** Lucide React.
* **Data Fetching :** TanStack Query v5 pour la gestion du cache et la synchronisation asynchrone des statuts de traitement.
* **UI State :** Zustand pour l'état du studio (clip sélectionné, lecture vidéo, paramètres de découpe).

---

### 2.5. Social Publishing & OAuth2 Integrations

#### 1. YouTube Shorts (Google OAuth2 & YouTube Data API v3)
* **Flow :** OAuth2 Authorization Code flow avec scope `https://www.googleapis.com/auth/youtube.upload`.
* **Endpoint :** `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`.
* **Spécificité Shorts :** La présence du hashtag `#Shorts` dans le titre/description et le ratio vertical 9:16 (< 60s) indexent automatiquement la vidéo comme un Short YouTube.

#### 2. TikTok (TikTok Content Posting API)
* **Flow :** OAuth2 Code flow vers `https://open.tiktokapis.com/v2/oauth/token/`.
* **Scope :** `video.upload` / `video.publish`.
* **Endpoint :** `POST https://open.tiktokapis.com/v2/post/publish/video/init/` puis upload du fichier binaire.

#### 3. Instagram Reels (Instagram Graph API / Meta Login)
* **Flow :** Facebook Login avec scopes `instagram_basic`, `instagram_content_publish`.
* **Endpoint :** 
  1. `POST /{ig-user-id}/media` avec `media_type=REELS`, `video_url` ou upload direct.
  2. `POST /{ig-user-id}/media_publish` avec le `creation_id` généré.

---

## 3. Compatibility & Environment Matrix

| Composant | Version Cible | Compatibilité |
|---|---|---|
| Python | 3.11+ / 3.12 | Windows 10/11, macOS, Linux |
| Node.js | 18+ / 20+ | Tous OS |
| FFmpeg | 5.x / 6.x / 7.x | Disponible dans le PATH système |
| faster-whisper | 1.0+ | CPU x86_64 / CUDA |
| React | 18+ / 19 | Navigateurs modernes (Chrome, Edge, Firefox, Safari) |

---

## 4. Technical Risks & Mitigations

| Risque Technique | Impact | Mitigation Retenue |
|---|---|---|
| Fichiers volumineux (vidéos de 10 Go+) saturant la mémoire | Critique | Ne jamais lire l'intégralité du fichier en mémoire : streaming des flux vers disque, découpe par segments FFmpeg. |
| Temps de transcription Whisper trop long sur CPU modeste | Modéré | Utilisation de `faster-whisper` avec quantification `int8`, modèle `base` par défaut avec option d'ajustement. |
| Expiration des tokens OAuth2 lors d'une publication différée | Modéré | Implémentation d'un intercepteur automatique de rafraîchissement des tokens avant tout appel API d'upload. |

---

## 5. Recommendation & Conclusion
La stack technique est validée. Elle concilie performance maximale en traitement local, simplicité de déploiement (zéro service cloud obligatoire pour le core) et expérience utilisateur haut de gamme.
* **Status :** APPROVED
* **Next Phase :** 04 — repository-research / 05 — task-planning
