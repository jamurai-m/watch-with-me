from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "watch-with-me-api"
    cors_origins: tuple[str, ...] = ("http://localhost:3000",)


def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS")
    if not origins:
        return Settings()

    parsed_origins = tuple(origin.strip() for origin in origins.split(",") if origin.strip())
    return Settings(cors_origins=parsed_origins or Settings().cors_origins)
