import os
from sqlmodel import SQLModel, create_engine, Session

DATABASE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "voyageai.db")
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# Use connect_args={"check_same_thread": False} for SQLite in multithreaded environments
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
