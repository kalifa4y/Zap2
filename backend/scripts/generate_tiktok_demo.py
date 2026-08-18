import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMP_FRAMES_DIR = os.path.join(ROOT_DIR, "storage", "temp_frames")
OUTPUT_VIDEO_PATH = os.path.join(ROOT_DIR, "tiktok_demo_zap2.mp4")
LOGO_PATH = os.path.join(ROOT_DIR, "logo.png")

os.makedirs(TEMP_FRAMES_DIR, exist_ok=True)

WIDTH, HEIGHT = 1920, 1080
FPS = 24

# Colors
BG_DARK = (13, 13, 17)
PANEL_BG = (20, 20, 26)
CARD_BG = (27, 27, 36)
BORDER_COLOR = (43, 43, 56)
LIME = (187, 242, 70)
WHITE = (255, 255, 255)
GRAY = (160, 160, 175)
DARK_GRAY = (80, 80, 95)
TIKTOK_BLACK = (18, 18, 18)
TIKTOK_RED = (254, 44, 85)
TIKTOK_CYAN = (37, 244, 238)
GREEN = (34, 197, 94)

# Load fonts
try:
    font_large = ImageFont.truetype("arialbd.ttf", 36)
    font_title = ImageFont.truetype("arialbd.ttf", 26)
    font_regular = ImageFont.truetype("arial.ttf", 20)
    font_bold = ImageFont.truetype("arialbd.ttf", 20)
    font_small = ImageFont.truetype("arial.ttf", 15)
    font_mono = ImageFont.truetype("consola.ttf", 16)
    font_mono_bold = ImageFont.truetype("consolab.ttf", 18)
    font_sub_big = ImageFont.truetype("arialbd.ttf", 22)
except:
    font_large = ImageFont.load_default()
    font_title = font_large
    font_regular = font_large
    font_bold = font_large
    font_small = font_large
    font_mono = font_large
    font_mono_bold = font_large
    font_sub_big = font_large

# Load Logo
logo_img = None
if os.path.exists(LOGO_PATH):
    try:
        logo_img = Image.open(LOGO_PATH).convert("RGBA")
        logo_img = logo_img.resize((48, 48), Image.Resampling.LANCZOS)
    except:
        pass

def draw_browser_chrome(draw, url="https://zap2.onrender.com"):
    # Window Chrome top bar
    draw.rectangle([(0, 0), (WIDTH, 75)], fill=(18, 18, 22))
    draw.line([(0, 75), (WIDTH, 75)], fill=BORDER_COLOR, width=1)
    
    # Window controls (macOS / browser style dots)
    draw.ellipse([(20, 22), (32, 34)], fill=(239, 68, 68))
    draw.ellipse([(40, 22), (52, 34)], fill=(245, 158, 11))
    draw.ellipse([(60, 22), (72, 34)], fill=(16, 185, 129))
    
    # URL address bar
    draw.rounded_rectangle([(180, 14), (WIDTH - 180, 60)], radius=12, fill=(28, 28, 36), outline=(50, 50, 65), width=1)
    
    # Padlock and URL
    draw.text((205, 27), "🔒  " + url, fill=(230, 230, 240), font=font_mono)
    draw.rounded_rectangle([(WIDTH - 300, 22), (WIDTH - 195, 52)], radius=8, fill=(35, 45, 30), outline=LIME, width=1)
    draw.text((WIDTH - 290, 29), "PROD LIVE", fill=LIME, font=font_small)

def draw_app_header(draw, active_tab="upload"):
    # Header container
    draw.rectangle([(0, 76), (WIDTH, 145)], fill=(15, 15, 20))
    draw.line([(0, 145), (WIDTH, 145)], fill=BORDER_COLOR, width=1)
    
    # Logo
    if logo_img:
        draw.bitmap((40, 86), logo_img)
    
    # Title
    draw.text((100, 88), "ZAP", fill=WHITE, font=font_title)
    draw.text((158, 88), "2", fill=LIME, font=font_title)
    
    # Tag
    draw.rounded_rectangle([(185, 93), (295, 123)], radius=6, fill=(25, 35, 20), outline=LIME, width=1)
    draw.text((195, 100), "AI STUDIO 9:16", fill=LIME, font=font_small)
    
    # Subtitle
    draw.text((100, 120), "Studio IA de Repurposing 9:16 & Multi-Posting", fill=GRAY, font=font_small)
    
    # Status badges
    draw.rounded_rectangle([(WIDTH - 380, 95), (WIDTH - 200, 128)], radius=8, fill=PANEL_BG, outline=BORDER_COLOR, width=1)
    draw.ellipse([(WIDTH - 365, 107), (WIDTH - 355, 117)], fill=LIME)
    draw.text((WIDTH - 345, 103), "TikTok API : Active", fill=(220, 220, 230), font=font_small)
    
    # Tabs
    tabs = [
        ("upload", "1. Ingestion & Vidéo"),
        ("studio", "2. Studio 9:16 & Clips"),
        ("accounts", "3. Réseaux & Auto-Post")
    ]
    tab_x = 40
    draw.rectangle([(0, 146), (WIDTH, 195)], fill=(12, 12, 15))
    draw.line([(0, 195), (WIDTH, 195)], fill=BORDER_COLOR, width=1)
    
    for key, label in tabs:
        is_active = (key == active_tab)
        w = len(label) * 11 + 30
        if is_active:
            draw.rounded_rectangle([(tab_x, 152), (tab_x + w, 193)], radius=8, fill=(25, 35, 20), outline=LIME, width=1)
            draw.text((tab_x + 15, 163), label, fill=LIME, font=font_bold)
        else:
            draw.text((tab_x + 15, 163), label, fill=GRAY, font=font_regular)
        tab_x += w + 20

def draw_footer(draw):
    draw.rectangle([(0, HEIGHT - 50), (WIDTH, HEIGHT)], fill=(10, 10, 14))
    draw.line([(0, HEIGHT - 50), (WIDTH, HEIGHT - 50)], fill=BORDER_COLOR, width=1)
    draw.text((40, HEIGHT - 33), "ZAP2 © 2026 — Studio de Découpage IA", fill=DARK_GRAY, font=font_small)
    draw.text((WIDTH - 500, HEIGHT - 33), "🔒 Politique de Confidentialité (/privacy)   |   📄 CGU (/terms)", fill=GRAY, font=font_small)

def draw_cursor(draw, x, y, click=False):
    fill = LIME if click else WHITE
    draw.polygon([(x, y), (x, y + 24), (x + 7, y + 18), (x + 16, y + 26), (x + 20, y + 22), (x + 11, y + 15), (x + 19, y + 14)], fill=fill, outline=(0, 0, 0))

# Sequence Builders
frames = []

def add_frame(img, repeat=1):
    for _ in range(repeat):
        frames.append(img.copy())

print("Generating demo video frames...")

# SCENE 1: Introduction & Ingestion Tab (0-5 sec)
for i in range(FPS * 4):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_chrome(draw, "https://zap2.onrender.com")
    draw_app_header(draw, active_tab="upload")
    
    # Video Ingestion Card
    draw.rounded_rectangle([(150, 230), (WIDTH - 150, 720)], radius=20, fill=PANEL_BG, outline=BORDER_COLOR, width=1)
    draw.text((190, 260), "Importer un Enregistrement ou Replay de Stream", fill=WHITE, font=font_title)
    draw.text((190, 298), "Glissez un fichier MP4 ou collez un lien YouTube / Twitch / TikTok", fill=GRAY, font=font_regular)
    
    # Dropzone
    draw.rounded_rectangle([(190, 340), (WIDTH - 190, 560)], radius=16, fill=CARD_BG, outline=LIME if i > 30 else BORDER_COLOR, width=2)
    draw.text((WIDTH // 2 - 180, 420), "📹  gaming_stream_replay_1080p.mp4", fill=WHITE, font=font_title)
    draw.text((WIDTH // 2 - 120, 465), "Durée: 01h 14m 32s  •  Taille: 1.42 GB", fill=GRAY, font=font_regular)
    
    # AI Process Button
    btn_color = LIME
    draw.rounded_rectangle([(WIDTH // 2 - 180, 600), (WIDTH // 2 + 180, 665)], radius=14, fill=btn_color)
    draw.text((WIDTH // 2 - 140, 622), "⚡ Lancer la Découpe IA 9:16", fill=(13, 13, 17), font=font_title)
    
    # Animated Cursor
    cursor_x = 300 + min(i * 12, WIDTH // 2 - 100)
    cursor_y = 350 + min(i * 5, 270)
    draw_cursor(draw, cursor_x, cursor_y, click=(i > FPS * 3))
    
    draw_footer(draw)
    add_frame(img)

# SCENE 2: Studio 9:16 Video Player with Kinetic Subtitles & Hooks (4-9 sec)
for i in range(FPS * 5):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_chrome(draw, "https://zap2.onrender.com/studio")
    draw_app_header(draw, active_tab="studio")
    
    # Left Column: Clip List
    draw.rounded_rectangle([(40, 220), (450, 980)], radius=16, fill=PANEL_BG, outline=BORDER_COLOR, width=1)
    draw.text((65, 245), "Clips Viraux Détectés (5)", fill=WHITE, font=font_title)
    
    clips = [
        ("Short #1 — Réaction Épique", "Score: 96% 🔥", True),
        ("Short #2 — Le Moment Fort", "Score: 91% 🔥", False),
        ("Short #3 — Explication Choc", "Score: 88% 🔥", False),
        ("Short #4 — Climax du Live", "Score: 84% 🔥", False),
    ]
    cy = 300
    for title, score, sel in clips:
        bg = (35, 45, 25) if sel else CARD_BG
        bdr = LIME if sel else BORDER_COLOR
        draw.rounded_rectangle([(60, cy), (430, cy + 90)], radius=12, fill=bg, outline=bdr, width=2 if sel else 1)
        draw.text((80, cy + 20), title, fill=WHITE, font=font_bold)
        draw.text((80, cy + 50), score, fill=LIME if sel else GRAY, font=font_small)
        cy += 110
    
    # Center Column: 9:16 Vertical Video Player Simulation
    player_x = 520
    draw.rounded_rectangle([(player_x, 220), (player_x + 420, 980)], radius=24, fill=(5, 5, 8), outline=LIME, width=2)
    
    # Simulated vertical gameplay/stream video content
    draw.rectangle([(player_x + 10, 230), (player_x + 410, 970)], fill=(20, 25, 35))
    
    # Top animated hook title
    draw.rounded_rectangle([(player_x + 40, 290), (player_x + 380, 360)], radius=14, fill=(13, 13, 17), outline=LIME, width=2)
    draw.text((player_x + 60, 312), "🔥 CE MOMENT INATTENDU !", fill=LIME, font=font_bold)
    
    # Bottom kinetic subtitles (MrBeast Pop style)
    draw.rectangle([(player_x + 30, 780), (player_x + 390, 860)], fill=(13, 13, 17, 200))
    draw.text((player_x + 55, 805), "INCROYABLE RÉACTION EN LIVE !", fill=LIME, font=font_sub_big)
    
    # Right Column: Metadata & TikTok Publish CTA
    meta_x = 1000
    draw.rounded_rectangle([(meta_x, 220), (WIDTH - 40, 980)], radius=16, fill=PANEL_BG, outline=BORDER_COLOR, width=1)
    draw.text((meta_x + 30, 245), "Métadonnées & Diffusion TikTok", fill=WHITE, font=font_title)
    
    draw.text((meta_x + 30, 310), "Titre du Short TikTok :", fill=GRAY, font=font_small)
    draw.rounded_rectangle([(meta_x + 30, 335), (WIDTH - 70, 390)], radius=10, fill=CARD_BG, outline=BORDER_COLOR, width=1)
    draw.text((meta_x + 45, 350), "Moment Inattendu en Direct ! #Shorts #TikTok #Zap2", fill=WHITE, font=font_regular)
    
    # Subtitle Style Selector
    draw.text((meta_x + 30, 420), "Style Sous-titres :", fill=GRAY, font=font_small)
    draw.rounded_rectangle([(meta_x + 30, 445), (WIDTH - 70, 500)], radius=10, fill=CARD_BG, outline=BORDER_COLOR, width=1)
    draw.text((meta_x + 45, 460), "🔥 Style MrBeast (Electric Lime Pop)", fill=LIME, font=font_bold)
    
    # TikTok Publish Button
    draw.rounded_rectangle([(meta_x + 30, 870), (WIDTH - 70, 945)], radius=14, fill=LIME)
    draw.text((meta_x + 110, 895), "🚀 Diffuser sur TikTok / Réseaux", fill=(13, 13, 17), font=font_title)
    
    draw_footer(draw)
    add_frame(img)

# SCENE 3: Social Accounts & TikTok Login Kit OAuth2 Integration (9-14 sec)
for i in range(FPS * 5):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_chrome(draw, "https://zap2.onrender.com/accounts")
    draw_app_header(draw, active_tab="accounts")
    
    # TikTok Account Card
    draw.rounded_rectangle([(200, 250), (WIDTH - 200, 450)], radius=20, fill=PANEL_BG, outline=LIME if i > 30 else BORDER_COLOR, width=2)
    
    # TikTok Logo icon
    draw.rounded_rectangle([(240, 290), (330, 380)], radius=16, fill=TIKTOK_BLACK, outline=(50, 50, 50), width=1)
    draw.text((260, 315), "TikTok", fill=WHITE, font=font_title)
    
    draw.text((360, 295), "TikTok Content Posting & Login Kit", fill=WHITE, font=font_title)
    draw.text((360, 335), "Connecté en OAuth2 sécurisé • Scopes: user.info.basic, video.upload, video.publish", fill=GRAY, font=font_regular)
    
    # Connected Profile info
    draw.rounded_rectangle([(360, 370), (680, 420)], radius=10, fill=CARD_BG, outline=LIME, width=1)
    draw.ellipse([(370, 380), (405, 415)], fill=LIME)
    draw.text((420, 386), "@creator_zap2  (Vérifié ✓)", fill=WHITE, font=font_bold)
    
    # Connection badge
    draw.rounded_rectangle([(WIDTH - 420, 330), (WIDTH - 240, 380)], radius=12, fill=(25, 45, 25), outline=LIME, width=1)
    draw.text((WIDTH - 390, 345), "✓ Compte Actif", fill=LIME, font=font_bold)
    
    # Automated Calendar & Scheduling Queue
    draw.rounded_rectangle([(200, 490), (WIDTH - 200, 940)], radius=20, fill=PANEL_BG, outline=BORDER_COLOR, width=1)
    draw.text((240, 525), "Calendrier d'Auto-Programmation TikTok (Bot Autonome)", fill=WHITE, font=font_title)
    draw.text((240, 565), "Diffusion planifiée toutes les 2 heures", fill=GRAY, font=font_regular)
    
    # Queue Items
    queue = [
        ("Short #1 — Moment Inattendu", "TikTok (video.publish)", "Aujourd'hui à 14:00", "EN ATTENTE"),
        ("Short #2 — Climax du Live", "TikTok (video.publish)", "Aujourd'hui à 16:00", "EN ATTENTE"),
        ("Short #3 — Réaction Virale", "TikTok (video.publish)", "Aujourd'hui à 18:00", "EN ATTENTE"),
    ]
    qy = 620
    for q_title, q_plat, q_time, q_status in queue:
        draw.rounded_rectangle([(240, qy), (WIDTH - 240, qy + 75)], radius=12, fill=CARD_BG, outline=BORDER_COLOR, width=1)
        draw.text((265, qy + 16), q_title, fill=WHITE, font=font_bold)
        draw.text((265, qy + 45), q_plat + "  •  " + q_time, fill=GRAY, font=font_small)
        draw.rounded_rectangle([(WIDTH - 420, qy + 20), (WIDTH - 265, qy + 55)], radius=8, fill=(35, 35, 45), outline=LIME, width=1)
        draw.text((WIDTH - 400, qy + 27), q_status, fill=LIME, font=font_small)
        qy += 95
    
    draw_footer(draw)
    add_frame(img)

# SCENE 4: TikTok Live Direct Publishing Modal Flow (14-19 sec)
for i in range(FPS * 5):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_chrome(draw, "https://zap2.onrender.com/publish")
    draw_app_header(draw, active_tab="studio")
    
    # Dim background
    draw.rectangle([(0, 146), (WIDTH, HEIGHT - 50)], fill=(5, 5, 8))
    
    # Modal Center Window
    modal_x1, modal_y1, modal_x2, modal_y2 = 550, 240, 1370, 880
    draw.rounded_rectangle([(modal_x1, modal_y1), (modal_x2, modal_y2)], radius=24, fill=(20, 20, 26), outline=LIME, width=2)
    
    draw.text((modal_x1 + 40, modal_y1 + 40), "🚀 Multi-Diffusion & Publication TikTok", fill=WHITE, font=font_title)
    draw.text((modal_x1 + 40, modal_y1 + 80), "Sélectionnez les options de publication pour ce Short 9:16", fill=GRAY, font=font_regular)
    
    # TikTok Selected Card
    draw.rounded_rectangle([(modal_x1 + 40, modal_y1 + 130), (modal_x2 - 40, modal_y1 + 230)], radius=14, fill=(35, 45, 30), outline=LIME, width=2)
    draw.text((modal_x1 + 70, modal_y1 + 155), "✓ TikTok Content Posting API", fill=WHITE, font=font_bold)
    draw.text((modal_x1 + 70, modal_y1 + 185), "Compte associé : @creator_zap2  •  Format 1080x1920 (9:16)", fill=LIME, font=font_small)
    
    # Video details
    draw.text((modal_x1 + 40, modal_y1 + 260), "Titre : Moment Inattendu en Live #Shorts #TikTok", fill=WHITE, font=font_regular)
    draw.text((modal_x1 + 40, modal_y1 + 300), "Sous-titres intégrés : Oui (MrBeast Electric Lime)", fill=GRAY, font=font_regular)
    
    # Progress & Success simulation
    if i < FPS * 2:
        draw.rounded_rectangle([(modal_x1 + 40, modal_y1 + 370), (modal_x2 - 40, modal_y1 + 450)], radius=14, fill=CARD_BG, outline=BORDER_COLOR, width=1)
        draw.text((modal_x1 + 70, modal_y1 + 400), "⏳ Téléversement vers TikTok en cours (video.upload)...", fill=WHITE, font=font_regular)
        draw.rounded_rectangle([(modal_x1 + 70, modal_y1 + 430), (modal_x1 + 70 + int((i / (FPS * 2)) * 650), modal_y1 + 440)], radius=4, fill=LIME)
    else:
        draw.rounded_rectangle([(modal_x1 + 40, modal_y1 + 370), (modal_x2 - 40, modal_y1 + 470)], radius=14, fill=(20, 45, 25), outline=GREEN, width=2)
        draw.text((modal_x1 + 70, modal_y1 + 395), "🎉 Publié avec succès sur TikTok !", fill=GREEN, font=font_title)
        draw.text((modal_x1 + 70, modal_y1 + 435), "Lien direct : https://www.tiktok.com/@creator_zap2/video/7391823901", fill=LIME, font=font_small)
    
    # Close / Action
    draw.rounded_rectangle([(modal_x2 - 220, modal_y2 - 70), (modal_x2 - 40, modal_y2 - 25)], radius=10, fill=LIME)
    draw.text((modal_x2 - 180, modal_y2 - 55), "Terminer", fill=(13, 13, 17), font=font_bold)
    
    draw_footer(draw)
    add_frame(img)

# SCENE 5: Compliance, Privacy Policy & Final Screen (19-23 sec)
for i in range(FPS * 4):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_chrome(draw, "https://zap2.onrender.com/privacy")
    draw_app_header(draw, active_tab="accounts")
    
    # Legal Card
    draw.rounded_rectangle([(250, 240), (WIDTH - 250, 880)], radius=20, fill=PANEL_BG, outline=LIME, width=2)
    draw.text((290, 280), "🛡️ Politique de Confidentialité & Conformité TikTok", fill=WHITE, font=font_title)
    
    draw.text((290, 340), "1. Utilisation exclusive des scopes TikTok (user.info.basic, video.upload, video.publish)", fill=WHITE, font=font_bold)
    draw.text((290, 380), "ZAP2 utilise les API officielles uniquement pour téléverser les vidéos expressément validées par l'utilisateur.", fill=GRAY, font=font_regular)
    
    draw.text((290, 440), "2. Protection des Données & Tokens", fill=WHITE, font=font_bold)
    draw.text((290, 480), "Aucune donnée personnelle n'est vendue, transférée ou partagée avec des tiers.", fill=GRAY, font=font_regular)
    
    draw.text((290, 540), "3. Contrôle Utilisateur & Révocation", fill=WHITE, font=font_bold)
    draw.text((290, 580), "L'accès peut être révoqué à tout moment depuis les paramètres de sécurité TikTok.", fill=GRAY, font=font_regular)
    
    # Contact & GitHub
    draw.rounded_rectangle([(290, 680), (WIDTH - 290, 820)], radius=14, fill=CARD_BG, outline=BORDER_COLOR, width=1)
    draw.text((320, 715), "Domaine Officiel : https://zap2.onrender.com", fill=LIME, font=font_bold)
    draw.text((320, 755), "Code Source : https://github.com/kalifa4y/Zap2", fill=WHITE, font=font_regular)
    
    draw_footer(draw)
    add_frame(img)

# Save all frames as temporary images
print(f"Total frames generated: {len(frames)}. Saving frame images...")
for idx, frame in enumerate(frames):
    frame_path = os.path.join(TEMP_FRAMES_DIR, f"frame_{idx:05d}.png")
    frame.save(frame_path)

print("Encoding MP4 video via FFmpeg...")
ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(TEMP_FRAMES_DIR, "frame_%05d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "20",
    "-preset", "fast",
    OUTPUT_VIDEO_PATH
]

res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
if res.returncode != 0:
    print(f"FFmpeg encoding failed: {res.stderr}")
else:
    print(f"SUCCESS: Video generated at {OUTPUT_VIDEO_PATH} ({os.path.getsize(OUTPUT_VIDEO_PATH)} bytes)")

# Clean up temp frames
shutil.rmtree(TEMP_FRAMES_DIR, ignore_errors=True)
