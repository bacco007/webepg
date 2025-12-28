from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "webEPG API"
    DEBUG: bool = False
    XMLTV_DATA_DIR: str = "xmltvdata/remote"
    XMLTV_SOURCES: str = "xmltvdata/settings/xmltvsources.json"
    XMLTV_SOURCES_LOCAL: str = "xmltvdata/settings/local.json"
    RADIO_AM_TRANSMITTER_DATA: str = "xmltvdata/transmitters/radio_am.json"
    RADIO_FM_TRANSMITTER_DATA: str = "xmltvdata/transmitters/radio_fm.json"
    RADIO_DAB_TRANSMITTER_DATA: str = "xmltvdata/transmitters/radio_dab.json"
    TV_TRANSMITTER_DATA: str = "xmltvdata/transmitters/television.json"

    # MySQL settings
    MYSQL_HOST: str = "localhost"
    MYSQL_USER: str = "your_default_user"
    MYSQL_PASSWORD: str = "your_default_password"
    MYSQL_DATABASE: str = "your_default_database"

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Path | None = None

    # API Key for protected endpoints
    ADMIN_API_KEY: str = "webepg-admin"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
