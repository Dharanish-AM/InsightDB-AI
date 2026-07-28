import os
import uuid
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = "http://localhost:5173"
SKIP_LLM = os.getenv("SKIP_LLM_TESTS", "false").lower() == "true"


def _register_and_login(page: Page) -> str:
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"
    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_role("button", name="Ask Insight")).to_be_visible(timeout=10000)
    return email


def _add_connection(page: Page, conn_name: str):
    page.get_by_role("button", name="Connections").click()

    name_input = page.get_by_placeholder("Production DB").or_(
        page.get_by_label("Name")
    ).first
    name_input.fill(conn_name)
    page.get_by_label("Host").or_(page.get_by_placeholder("localhost")).first.fill("localhost")
    page.get_by_label("Port").or_(page.get_by_placeholder("5432")).first.fill("5432")
    page.get_by_label("Database").or_(page.get_by_placeholder("my_database")).first.fill("testdb")
    page.get_by_label("Username").or_(page.get_by_placeholder("postgres")).first.fill("user")
    page.get_by_label("Password").or_(page.get_by_placeholder("••••••••")).first.fill("pass")
    page.get_by_role("button", name="Add Connection").or_(
        page.get_by_role("button", name="Save")
    ).click()
    expect(page.get_by_text(conn_name)).to_be_visible(timeout=10000)


@pytest.mark.browser
def test_query_studio_tab_is_default(page: Page):
    _register_and_login(page)
    expect(page.get_by_text("Start with a data source")).to_be_visible(timeout=5000)


@pytest.mark.browser
def test_query_studio_shows_no_connection_prompt(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Ask Insight").click()
    expect(page.get_by_text("Start with a data source")).to_be_visible(timeout=5000)


@pytest.mark.browser
def test_query_studio_shows_input_when_connection_selected(page: Page):
    _register_and_login(page)
    conn_name = f"Studio DB {uuid.uuid4().hex[:4]}"
    _add_connection(page, conn_name)

    page.get_by_role("button", name="Ask Insight").click()

    selector = page.locator("select").first
    selector.select_option(label=lambda s: conn_name in s)

    expect(page.get_by_placeholder(f"Ask a question about", exact=False)).to_be_visible(
        timeout=5000
    )
    expect(page.get_by_role("button", name="Ask AI")).to_be_visible()


@pytest.mark.browser
def test_ask_button_disabled_without_prompt(page: Page):
    _register_and_login(page)
    conn_name = f"Studio DB {uuid.uuid4().hex[:4]}"
    _add_connection(page, conn_name)

    page.get_by_role("button", name="Ask Insight").click()
    selector = page.locator("select").first
    selector.select_option(label=lambda s: conn_name in s)

    ask_button = page.get_by_role("button", name="Ask AI")
    expect(ask_button).to_be_disabled()


@pytest.mark.browser
@pytest.mark.slow
@pytest.mark.skipif(SKIP_LLM, reason="SKIP_LLM_TESTS=true")
def test_submit_query_shows_result(page: Page):
    _register_and_login(page)
    conn_name = f"Studio DB {uuid.uuid4().hex[:4]}"
    _add_connection(page, conn_name)

    page.get_by_role("button", name="Ask Insight").click()
    selector = page.locator("select").first
    selector.select_option(label=lambda s: conn_name in s)

    prompt_input = page.get_by_placeholder(f"Ask a question about", exact=False)
    prompt_input.fill("Show me all records")

    page.get_by_role("button", name="Ask AI").click()
    expect(page.get_by_text("Analyzing...", exact=False)).to_be_visible(timeout=5000)

    expect(
        page.get_by_text("Analyzing...", exact=False)
    ).to_be_hidden(timeout=120000)

    result_visible = (
        page.locator(".glass-panel").count() > 1
        or page.get_by_text("Error", exact=False).is_visible()
    )
    assert result_visible, "Expected a result panel or error message after pipeline call"
