import uuid
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = "http://localhost:5173"


@pytest.mark.browser
def test_auth_page_loads(page: Page):
    page.goto(FRONTEND_URL)
    expect(page.get_by_text("Welcome back")).to_be_visible()
    expect(page.get_by_placeholder("name@company.com")).to_be_visible()
    expect(page.get_by_placeholder("••••••••")).to_be_visible()
    expect(page.get_by_role("button", name="Sign In")).to_be_visible()


@pytest.mark.browser
def test_toggle_to_register_form(page: Page):
    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    expect(page.get_by_text("Create an account")).to_be_visible()
    expect(page.get_by_role("button", name="Create Account")).to_be_visible()


@pytest.mark.browser
def test_register_and_land_in_app(page: Page):
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"
    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)


@pytest.mark.browser
def test_login_with_valid_credentials(page: Page):
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"

    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)

    page.get_by_title("Logout").click()
    expect(page.get_by_text("Welcome back")).to_be_visible(timeout=5000)

    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Sign In").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)


@pytest.mark.browser
def test_login_with_wrong_password_shows_error(page: Page):
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"

    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)

    page.get_by_title("Logout").click()
    expect(page.get_by_text("Welcome back")).to_be_visible(timeout=5000)

    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("WrongPassword!")
    page.get_by_role("button", name="Sign In").click()
    expect(page.locator(".bg-rose-500\\/10")).to_be_visible(timeout=5000)


@pytest.mark.browser
def test_logout_returns_to_auth_page(page: Page):
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"

    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)

    page.get_by_title("Logout").click()
    expect(page.get_by_text("Welcome back")).to_be_visible(timeout=5000)
    expect(page.get_by_role("button", name="Sign In")).to_be_visible()
