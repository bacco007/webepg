import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI XMLTV App"
    DEBUG: bool = False
    XMLTV_DATA_DIR: str = "xmltvdata/remote"
    # XMLTV_DATA_REMOTE_DIR: str ="xmltvdata/remote"
    XMLTV_SOURCES: str = "xmltvdata/settings/xmltvsources.json"

    class Config:
        env_file = ".env"

settings = Settings()
