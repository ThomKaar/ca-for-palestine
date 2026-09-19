import json

import httpx

import openai_text


def test_openai_text_helper_uses_native_chat_completion_shape(monkeypatch):
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["authorization"] = request.headers["Authorization"]
        captured["body"] = json.loads(request.content)
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": '{"text":"Ada"}'}}],
                "usage": {"prompt_tokens": 10, "completion_tokens": 2},
            },
        )

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_TEXT_MODEL", "gpt-4.1-mini")
    monkeypatch.setattr(openai_text, "CLIENT", httpx.Client(transport=httpx.MockTransport(handler)))

    value, metadata = openai_text.field_text({"field": {"label": "First name"}, "goal": "Use Ada"})

    assert value == "Ada"
    assert metadata["model"] == "gpt-4.1-mini"
    assert captured["url"] == "https://api.openai.com/v1/chat/completions"
    assert captured["authorization"] == "Bearer test-key"
    response_format = captured["body"]["response_format"]
    assert response_format["type"] == "json_schema"
    assert response_format["json_schema"]["strict"] is True
    assert response_format["json_schema"]["schema"]["additionalProperties"] is False
    assert captured["body"]["store"] is False
    assert "reasoning" not in captured["body"]
    assert "reasoning_effort" not in captured["body"]


def test_openai_text_helper_requires_a_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    try:
        openai_text.field_text({"field": {"label": "First name"}})
    except ValueError as error:
        assert "OPENAI_API_KEY" in str(error)
    else:
        raise AssertionError("Expected a missing-key error")


def test_openai_text_helper_reports_the_field_when_value_is_missing(monkeypatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"text":null}'}}]},
        )

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(openai_text, "CLIENT", httpx.Client(transport=httpx.MockTransport(handler)))

    try:
        openai_text.field_text({"field": {"label": "Is a response required?"}})
    except openai_text.MissingFieldValue as error:
        assert "Is a response required?" in str(error)
        assert "No value was available" in str(error)
        assert error.field_label == "Is a response required?"
    else:
        raise AssertionError("Expected a missing-value error")


def test_openai_text_helper_reports_refusals_without_echoing_content(monkeypatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"choices": [{"message": {"refusal": "No"}}]},
        )

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(openai_text, "CLIENT", httpx.Client(transport=httpx.MockTransport(handler)))

    try:
        openai_text.field_text({"field": {"label": "Subject"}, "goal": "private message"})
    except ValueError as error:
        assert "field 'Subject'" in str(error)
        assert "private message" not in str(error)
    else:
        raise AssertionError("Expected a refusal error")
