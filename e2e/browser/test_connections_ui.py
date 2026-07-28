import uuid
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = "http://localhost:5173"


def _register_and_login(page: Page) -> str:
    email = f"ui_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"
    page.goto(FRONTEND_URL)
    page.get_by_text("Register now").click()
    page.get_by_placeholder("name@company.com").fill(email)
    page.get_by_placeholder("••••••••").fill("Password123!")
    page.get_by_role("button", name="Create Account").click()
    expect(page.get_by_text("Query Studio")).to_be_visible(timeout=10000)
    return email


@pytest.mark.browser
def test_connections_tab_is_accessible(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Connections").click()
    expect(page.get_by_text("Connections")).to_be_visible()


@pytest.mark.browser
def test_connections_tab_shows_empty_state_initially(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Connections").click()
    expect(page.get_by_text("No connections yet", exact=False).or_(
        page.get_by_text("Add Connection", exact=False)
    )).to_be_visible(timeout=5000)


@pytest.mark.browser
def test_add_connection_form_is_visible(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Connections").click()
    expect(page.get_by_placeholder("Production DB", exact=False).or_(
        page.get_by_label("Name", exact=False)
    )).to_be_visible(timeout=5000)


@pytest.mark.browser
def test_create_connection_appears_in_list(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Connections").click()

    conn_name = f"Test PG {uuid.uuid4().hex[:4]}"

    name_input = page.get_by_placeholder("Production DB").or_(
        page.get_by_label("Name")
    ).first
    name_input.fill(conn_name)

    page.get_by_label("Host").or_(page.get_by_placeholder("localhost")).first.fill(
        "localhost"
    )
    page.get_by_label("Port").or_(page.get_by_placeholder("5432")).first.fill("5432")
    page.get_by_label("Database").or_(
        page.get_by_placeholder("my_database")
    ).first.fill("testdb")
    page.get_by_label("Username").or_(
        page.get_by_placeholder("postgres")
    ).first.fill("testuser")
    page.get_by_label("Password").or_(
        page.get_by_placeholder("••••••••")
    ).first.fill("testpass")

    page.get_by_role("button", name="Add Connection").or_(
        page.get_by_role("button", name="Save")
    ).click()

    expect(page.get_by_text(conn_name)).to_be_visible(timeout=10000)


@pytest.mark.browser
def test_connection_selector_dropdown_populates(page: Page):
    _register_and_login(page)
    page.get_by_role("button", name="Connections").click()

    conn_name = f"Selector DB {uuid.uuid4().hex[:4]}"

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

    selector = page.locator("select").first
    expect(selector.locator(f"option:has-text('{conn_name}')")).to_be_attached(
        timeout=5000
    )
