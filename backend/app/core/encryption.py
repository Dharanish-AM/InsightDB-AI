import base64
from cryptography.fernet import Fernet
from app.core.config import settings


def _get_fernet() -> Fernet:
    key_bytes = settings.ENCRYPTION_KEY.encode()
    if len(key_bytes) != 44:
        padded_key = base64.urlsafe_b64encode(settings.ENCRYPTION_KEY.ljust(32, "0")[:32].encode())
        return Fernet(padded_key)
    return Fernet(key_bytes)


def encrypt_string(plain_text: str) -> str:
    if not plain_text:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plain_text.encode()).decode()


def decrypt_string(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    fernet = _get_fernet()
    return fernet.decrypt(cipher_text.encode()).decode()
