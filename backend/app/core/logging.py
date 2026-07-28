import logging
import sys
from app.core.config import settings


def setup_logging():
    """
    Configures structured logging for the application.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Silence overly verbose third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    logger = logging.getLogger(settings.PROJECT_NAME)
    logger.info(f"Logging initialized. Environment: {settings.ENVIRONMENT}, Debug: {settings.DEBUG}")
    return logger
