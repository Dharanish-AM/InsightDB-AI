import uuid
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = "http://localhost:5173"


def register_and_login(page: Page, email: str, password: str = "Password123!"):
    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill(password)
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("InsightDB AI")).to_be_visible(timeout=10000)


def login(page: Page, email: str, password: str = "Password123!"):
    page.goto(FRONTEND_URL)
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill(password)
    page.get_by_role("button", name="Sign In").click()
    expect(page.get_by_text("InsightDB AI")).to_be_visible(timeout=10000)


@pytest.fixture
def unique_email() -> str:
    return f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"
