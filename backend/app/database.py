# database.py — sets up SQLite + SQLAlchemy session handling.
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# The whole database is one local file: evalforge.db (created automatically).
# check_same_thread=False lets FastAPI share the connection across requests.
# timeout=30 makes SQLite wait up to 30s for a write lock to clear instead
# of raising "database is locked" immediately on overlapping writes.
SQLALCHEMY_DATABASE_URL = "sqlite:///./evalforge.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
)

# A Session is one "conversation" with the DB. We open one per request.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Every table (model) inherits from this Base.
Base = declarative_base()


# FastAPI dependency: open a session, give it to the route, close it after.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
