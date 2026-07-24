import os
from sqlmodel import SQLModel, create_engine, Session

# Read from environment, fall back to SQLite
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "voyageai.db")
    DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# Use connect_args={"check_same_thread": False} ONLY for SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Handle postgresql:// driver prefix variations if necessary
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
