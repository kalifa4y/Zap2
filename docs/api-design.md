# API Design Specification — SnapCut

## 1. Overview & Conventions
* **Base URL :** `http://localhost:8000/api/v1`
* **Format :** JSON (`application/json`) pour les requêtes et réponses structurées, `multipart/form-data` pour l'upload vidéo.
* **Gestion des erreurs :** Code HTTP standard + payload `{ "detail": "Message explicatif" }`.

---

## 2. Endpoints Catalogue

### 2.1. Module Videos (`/api/v1/videos`)

#### `POST /api/v1/videos/upload`
* **Description :** Téléverse un fichier vidéo local et extrait ses métadonnées.
* **Content-Type :** `multipart/form-data`
* **Form-Data :** `file: UploadFile` (.mp4, .mov, .mkv, .webm)
* **Response 201 :**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "filename": "live_recording.mp4",
  "duration": 3600.5,
  "width": 1920,
  "height": 1080,
  "status": "UPLOADED",
  "created_at": "2026-08-18T16:30:00Z"
}
```

#### `GET /api/v1/videos/{id}`
* **Description :** Récupère les métadonnées d'une vidéo uploadée.
* **Response 200 :** Schéma `ProjectRead`.

#### `GET /api/v1/videos/stream/{id}`
* **Description :** Stream vidéo avec support HTTP 206 Partial Content (Range headers).

---

### 2.2. Module Cut & Processing (`/api/v1/cut`)

#### `POST /api/v1/cut/process`
* **Description :** Lance le pipeline asynchrone d'analyse acoustique, transcription et découpage.
* **Request Body :**
```json
{
  "project_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "silence_db": -30.0,
  "min_silence_duration": 0.5,
  "whisper_model": "base",
  "min_clip_duration": 30.0,
  "max_clip_duration": 60.0
}
```
* **Response 202 Accepted :**
```json
{
  "task_id": "task_abc123",
  "project_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "PROCESSING",
  "progress": 0,
  "current_stage": "Starting audio analysis..."
}
```

#### `GET /api/v1/cut/projects/{id}`
* **Description :** Récupère l'état complet du projet et la liste des clips générés.
* **Response 200 :**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "filename": "live_recording.mp4",
  "duration": 3600.5,
  "status": "COMPLETED",
  "progress": 100,
  "current_stage": "Finished rendering 9:16 clips",
  "clips": [
    {
      "id": "clip_01",
      "project_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Moment Fort #1 - SnapCut",
      "description": "Extrait du live #Shorts",
      "hashtags": "#Shorts #Trending #Live",
      "start_time": 120.0,
      "end_time": 165.0,
      "duration": 45.0,
      "file_path_9x16": "storage/exports/clip_01.mp4",
      "status": "READY"
    }
  ]
}
```

#### `PATCH /api/v1/cut/clips/{id}`
* **Description :** Met à jour les métadonnées (titre, hashtags, description) ou ajuste les bornes temporelles d'un clip.
* **Request Body :**
```json
{
  "title": "Nouveau titre accrocheur",
  "description": "Description mise à jour",
  "hashtags": "#Shorts #Viral",
  "start_time": 122.0,
  "end_time": 164.0
}
```

#### `GET /api/v1/cut/clips/{id}/stream`
* **Description :** Stream du clip vertical 9:16 exporté.

#### `GET /api/v1/cut/clips/{id}/download`
* **Description :** Téléchargement direct du fichier MP4 9:16 sur la machine locale.

---

### 2.3. Module Auth & Social (`/api/v1/auth` & `/api/v1/social`)

#### `GET /api/v1/auth/{platform}/authorize`
* **Description :** Retourne l'URL OAuth2 de consentement pour `youtube`, `tiktok` ou `instagram`.
* **Response 200 :**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=https://www.googleapis.com/auth/youtube.upload..."
}
```

#### `GET /api/v1/auth/{platform}/callback`
* **Description :** Réceptionne le code OAuth2, échange les tokens et enregistre le compte dans SQLite.
* **Query Params :** `code=...`, `state=...`

#### `GET /api/v1/social/accounts`
* **Description :** Liste tous les comptes sociaux connectés avec leur statut.
* **Response 200 :**
```json
[
  {
    "id": "acc_yt_01",
    "platform": "youtube",
    "account_name": "Mon Studio YouTube",
    "is_active": true,
    "token_expires_at": "2026-08-18T18:00:00Z"
  }
]
```

#### `DELETE /api/v1/social/accounts/{id}`
* **Description :** Déconnecte un compte social et révoque ses jetons.

#### `POST /api/v1/social/publish`
* **Description :** Déclenche la publication d'un clip vers une ou plusieurs plateformes sélectionnées.
* **Request Body :**
```json
{
  "clip_id": "clip_01",
  "platforms": ["youtube", "tiktok", "instagram"],
  "custom_title": "Titre personnalisé",
  "custom_description": "Description avec #Shorts"
}
```
* **Response 202 Accepted :**
```json
{
  "jobs": [
    {
      "id": "job_01",
      "platform": "youtube",
      "status": "UPLOADING",
      "error_message": null
    }
  ]
}
```

#### `GET /api/v1/social/jobs/{id}`
* **Description :** Suivi en temps réel de l'état d'un job de publication (`PENDING`, `UPLOADING`, `PUBLISHED`, `FAILED`).

---

## 3. Status & Next Step
* **Status :** PASS
* **Next Phase :** 09 — ui-ux-design
