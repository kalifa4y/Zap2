from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLite connection
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models before creating tables
    import app.models.project
    import app.models.clip
    import app.models.social
    Base.metadata.create_all(bind=engine)

    # Auto-migrate SQLite missing columns if schema changed
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            # Check projects table
            try:
                result = conn.execute(engine.raw_connection().cursor().connection.execute("PRAGMA table_info(projects)")) if False else conn.exec_driver_sql("PRAGMA table_info(projects)").fetchall()
                existing_cols = {row[1] for row in result}
                if "source_type" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE projects ADD COLUMN source_type VARCHAR(50) DEFAULT 'FILE_UPLOAD'")
                if "source_metadata" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE projects ADD COLUMN source_metadata TEXT")
            except Exception as e:
                print(f"[DB Migration] projects check: {e}")

            # Check clips table
            try:
                result = conn.exec_driver_sql("PRAGMA table_info(clips)").fetchall()
                existing_cols = {row[1] for row in result}
                if "hook_title" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE clips ADD COLUMN hook_title VARCHAR(255)")
                if "thematic_topic" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE clips ADD COLUMN thematic_topic VARCHAR(100)")
                if "virality_score" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE clips ADD COLUMN virality_score INTEGER DEFAULT 80")
                if "subtitle_style" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE clips ADD COLUMN subtitle_style VARCHAR(50) DEFAULT 'mrbeast'")
            except Exception as e:
                print(f"[DB Migration] clips check: {e}")

            # Check publish_jobs table
            try:
                result = conn.exec_driver_sql("PRAGMA table_info(publish_jobs)").fetchall()
                existing_cols = {row[1] for row in result}
                if "scheduled_at" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE publish_jobs ADD COLUMN scheduled_at DATETIME")
                if "frequency_interval" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE publish_jobs ADD COLUMN frequency_interval VARCHAR(50)")
            except Exception as e:
                print(f"[DB Migration] publish_jobs check: {e}")
            conn.commit()
