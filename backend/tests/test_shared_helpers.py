"""Pure validation/localization tests. No Flask mock is used."""
import pytest
from app.errors import ApiError
from app.validation import validate_support_language, validate_email, require_string, require_boolean
from app.localization import resolve_support_language, localized_value


@pytest.mark.parametrize("value", [[], {}, 1, True, None, "fr", "", "VI"])
def test_invalid_language_is_422_not_type_error(value):
    with pytest.raises(ApiError) as error: validate_support_language(value)
    assert (error.value.status,error.value.code) == (422,"validation_error")


@pytest.mark.parametrize("value", [[], {}, None, "x", "@a", "a@", "a@@b", "a b@c"])
def test_invalid_email_has_contract_error(value):
    with pytest.raises(ApiError) as error: validate_email(value)
    assert error.value.status == 422


def test_email_normalization_matches_basic_contract():
    assert validate_email(" A@B ") == "a@b"


def test_password_not_silently_stripped():
    assert require_string({"password":"  abcdefgh  "}, "password", min_length=8, strip=False) == "  abcdefgh  "
    assert require_string({"label":"  text  "}, "label") == "text"


@pytest.mark.parametrize("value", [1,"true",None,[]])
def test_booleans_are_not_truthiness(value):
    with pytest.raises(ApiError): require_boolean({"learned":value},"learned")


def test_null_language_is_read_time_only():
    row = {"title_vi":None,"title_en":"Fixture EN","title_fr":"Fixture FR","support_language":None}
    assert resolve_support_language(row["support_language"]) == "vi"
    assert localized_value(row,"title",None,french_fallback_field="title_fr") == "Fixture FR"
    assert row["support_language"] is None
    assert localized_value(row,"title","en") == "Fixture EN"
