# 🚀 Guide de Déploiement en Production & Validation TikTok for Developers

Ce guide vous explique étape par étape comment **mettre ZAP2 en production sur un nom de domaine public HTTPS** et soumettre votre application au **portail TikTok for Developers** pour obtenir l'approbation officielle de l'API de publication directe (*Content Posting API* & *Login Kit*).

---

## 📋 1. Pourquoi la mise en production est obligatoire pour TikTok

TikTok exige des critères stricts pour approuver une application :
1. **Un domaine public en HTTPS** (les adresses `http://localhost` sont refusées pour la validation finale).
2. **Une Politique de Confidentialité publique active** (URL accessible publiquement expliquant la gestion des données).
3. **Des Conditions Générales d'Utilisation (CGU) publiques actives**.
4. **Une URL de redirection OAuth2 publique valide**.
5. **Une vidéo de démonstration** montrant l'utilisateur connectant son compte TikTok et publiant un Short 9:16 depuis l'interface ZAP2.

---

## 🌐 2. Options de Déploiement en Production (Recommandations)

### Option A : Déploiement 1-Clic sur Render (Le plus simple & rapide)

Render permet de déployer l'image Docker de ZAP2 en quelques clics avec un certificat SSL HTTPS gratuit et un sous-domaine `https://zap2-studio.onrender.com` :

1. Créez un compte sur [Render.com](https://render.com).
2. Cliquez sur **New +** &gt; **Blueprint** (ou **Web Service**).
3. Connectez votre repository GitHub **`https://github.com/kalifa4y/Zap2`**.
4. Render détecte automatiquement le fichier [`render.yaml`](../render.yaml) et le [`Dockerfile`](../Dockerfile).
5. Cliquez sur **Apply** : Render compile le frontend Vite, installe Python 3.11 avec FFmpeg, et lance votre serveur en production avec HTTPS actif !
6. Vous obtenez votre URL publique : `https://zap2-studio.onrender.com`.

---

### Option B : Déploiement sur Railway

1. Rendez-vous sur [Railway.app](https://railway.app).
2. Cliquez sur **New Project** &gt; **Deploy from GitHub repo** &gt; sélectionnez `kalifa4y/Zap2`.
3. Railway construira automatiquement le conteneur via le [`Dockerfile`](../Dockerfile).
4. Dans l'onglet **Settings** du service, générez un domaine public gratuit (ex: `https://zap2-production.up.railway.app`).

---

### Option C : Déploiement sur VPS (Ubuntu / Debian avec Docker & Nginx/Caddy)

Si vous disposez d'un VPS (OVH, Hetzner, DigitalOcean) avec votre propre nom de domaine (ex: `https://zap2.app`) :

```bash
# 1. Cloner le repository
git clone https://github.com/kalifa4y/Zap2.git
cd Zap2

# 2. Lancer le conteneur Docker en arrière-plan
docker compose up -d --build
```

Configurez un reverse-proxy Nginx avec Certbot Let's Encrypt :
```nginx
server {
    server_name zap2.app www.zap2.app;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🎯 3. Configuration du Portail TikTok for Developers

Une fois votre site en ligne (ex: `https://votre-domaine.com`), rendez-vous sur **[TikTok for Developers](https://developers.tiktok.com/)** :

### Étape 1 : Informations de base de l'Application
* **App Name** : `ZAP2`
* **App Icon** : Téléversez le fichier [`logo.png`](../logo.png)
* **App Category** : `Video Creator Tools` / `Productivity`
* **Terms of Service URL** : `https://<VOTRE-DOMAINE>/terms`
* **Privacy Policy URL** : `https://<VOTRE-DOMAINE>/privacy`

---

### Étape 2 : Ajouter les Produits TikTok
Dans votre tableau de bord TikTok Developers, activez les deux produits :
1. **Login Kit** (Authentification de l'utilisateur).
2. **Content Posting API** (Publication directe des vidéos 9:16).

---

### Étape 3 : URLs de Redirection OAuth (Redirect URI)
Renseignez les URLs de callback :
* `https://<VOTRE-DOMAINE>/api/v1/auth/tiktok/callback`
* `https://<VOTRE-DOMAINE>/auth/callback/tiktok`

---

### Étape 4 : Récupérer les Clés API & Configurer ZAP2
Copiez vos identifiants TikTok :
* `Client Key`
* `Client Secret`

Ajoutez-les dans les variables d'environnement de votre hébergement (ou dans le fichier `.env` du serveur) :
```env
TIKTOK_CLIENT_KEY=votre_client_key_ici
TIKTOK_CLIENT_SECRET=votre_client_secret_ici
TIKTOK_REDIRECT_URI=https://<VOTRE-DOMAINE>/api/v1/auth/tiktok/callback
```

---

## 🎬 4. Préparer la Démonstration Vidéo pour la Validation TikTok

TikTok exige une courte vidéo d'enregistrement d'écran (1 à 2 minutes) démontrant l'usage de l'API.

### Scénario à enregistrer :
1. **Accueil ZAP2 :** Montrez l'interface avec le logo ZAP2 et les liens vers la politique de confidentialité.
2. **Import Vidéo :** Téléversez une vidéo ou collez une URL.
3. **Découpage 9:16 :** Montrez l'aperçu du Short généré avec le sous-titrage cinétique.
4. **Connexion TikTok :** Rendez-vous dans l'onglet *Réseaux & Auto-Post*, cliquez sur *Connecter TikTok* (l'écran de consentement officiel TikTok OAuth s'affiche).
5. **Publication :** Cliquez sur *Publier sur TikTok* et montrez la notification de succès.
6. **Justification textuelle pour l'examinateur TikTok :**
   > *"ZAP2 is a video repurposing studio that enables creators to automatically extract highlights from their long-form streams into vertical 9:16 shorts. The TikTok Content Posting API is used solely to publish user-approved clips directly to their verified TikTok profile."*

---

## ✅ 5. Vérification & Mise en Service

Vos pages légales et conformes sont d'ores et déjà opérationnelles :
* **Page Politique de Confidentialité** : `https://<VOTRE-DOMAINE>/privacy`
* **Page Conditions Générales d'Utilisation** : `https://<VOTRE-DOMAINE>/terms`
* **Vérification de Santé API** : `https://<VOTRE-DOMAINE>/api/v1/health`
