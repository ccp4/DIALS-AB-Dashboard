from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    WORKSPACE_DIR: str = "./workspace"
    FRONTEND_URL: str = "http://localhost:5173"
    WORKSPACE_TYPE: str = "local"

    model_config = SettingsConfigDict(env_file=".env")