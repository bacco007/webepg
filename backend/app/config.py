from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "FastAPI XMLTV App"
    DEBUG: bool = False
    XMLTV_DATA_DIR: str = "xmltvdata/remote"
    XMLTV_SOURCES: str = "xmltvdata/settings/xmltvsources.json"
    XMLTV_SOURCES_LOCAL: str = "xmltvdata/settings/local.json"

    # MySQL settings
    MYSQL_HOST: str = "localhost"
    MYSQL_USER: str = "your_default_user"
    MYSQL_PASSWORD: str = "your_default_password"
    MYSQL_DATABASE: str = "your_default_database"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
