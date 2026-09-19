import json

from app import EmailContent, Submission, UserInfo, goal_for, label_looks_required, prepare_page_actions


def submission(alternate_phone: str = "") -> Submission:
    return Submission(
        senator="Padilla",
        email=EmailContent(subject="Subject", body="Body", representative="Senator Alex Padilla"),
        userInfo=UserInfo(
            firstName="Ada",
            lastName="Lovelace",
            addressOne="1 Main Street",
            city="San Francisco",
            state="California",
            zipCode="94105",
            phoneNumber="4155550100",
            alternatePhoneNumber=alternate_phone,
            email="ada@example.com",
        ),
    )


def field_values(item: Submission) -> dict:
    marker = "FIELD_VALUES_JSON="
    return json.loads(goal_for(item).split(marker, 1)[1].split("\n", 1)[0])


def test_goal_includes_an_optional_alternate_phone():
    assert field_values(submission())["alternate_phone"] is None
    assert field_values(submission("4155550101"))["alternate_phone"] == "4155550101"


def test_any_remembered_missing_field_is_removed_from_jev_choices():
    page = {
        "actions": [
            {"id": "a", "kind": "fill", "label": "Alternate Phone Number"},
            {"id": "b", "kind": "fill", "label": "Employer"},
            {"id": "c", "kind": "fill", "label": "Email"},
        ]
    }
    prepare_page_actions(page, {"alternate phone number", "employer"})
    assert [action["id"] for action in page["actions"]] == ["c"]


def test_fields_not_marked_missing_remain_jev_choices():
    page = {"actions": [{"id": "a", "kind": "fill", "label": "Alternate Phone Number"}]}
    prepare_page_actions(page, set())
    assert [action["id"] for action in page["actions"]] == ["a"]


def test_redundant_textbox_open_click_is_removed():
    page = {
        "actions": [
            {"id": "a", "node": 1, "kind": "fill", "role": "textbox", "label": "First Name"},
            {"id": "b", "node": 1, "kind": "click", "role": "textbox", "label": "Open First Name"},
            {"id": "c", "node": 2, "kind": "click", "role": "button", "label": "Submit"},
        ]
    }
    prepare_page_actions(page, set())
    assert [action["id"] for action in page["actions"]] == ["a", "c"]


def test_completed_nonempty_field_is_removed_but_empty_field_can_be_retried():
    page = {
        "actions": [
            {"id": "a", "node": 1, "kind": "fill", "role": "textbox", "label": "Phone", "value": "4155550100"},
            {"id": "b", "node": 2, "kind": "fill", "role": "textbox", "label": "Email", "value": ""},
        ]
    }
    prepare_page_actions(page, set(), {1, 2})
    assert [action["id"] for action in page["actions"]] == ["b"]


def test_combobox_open_click_remains_available():
    page = {
        "actions": [
            {"id": "a", "node": 1, "kind": "fill", "role": "combobox", "label": "City"},
            {"id": "b", "node": 1, "kind": "click", "role": "combobox", "label": "Open City"},
        ]
    }
    prepare_page_actions(page, set())
    assert [action["id"] for action in page["actions"]] == ["a", "b"]


def test_required_field_labels_are_not_treated_as_skippable():
    assert label_looks_required("Phone Number*")
    assert label_looks_required("First Name (Required)")
    assert not label_looks_required("Alternate Phone Number")
