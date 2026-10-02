"""Shared JSON error envelope; no domain/business rules."""


class ApiError(Exception):
    """Expected application failure. Messages/details must be safe for clients."""

    def __init__(self, status, code, message, details=None):
        """Store the HTTP status and client-safe error payload fields."""
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = {} if details is None else details


def error_payload(code, message, details=None):
    """Build the standard error envelope from the given fields."""
    return {"error": {"code": code, "message": message,
                      "details": {} if details is None else details}}


def register_error_handlers(app):
    """Register JSON error handlers for ApiError and HTTP failures."""
    from flask import jsonify
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(ApiError)
    def handle_api_error(error):
        """Render an ApiError as its JSON envelope and stored status."""
        return jsonify(error_payload(error.code, error.message, error.details)), error.status

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Render an HTTPException as JSON while keeping its headers."""
        # Retain protocol headers such as Allow on 405 while replacing HTML.
        response = error.get_response()
        code = error.name.lower().replace(" ", "_").replace("-", "_")
        response.data = app.json.dumps(error_payload(code, error.name + "."))
        response.content_type = "application/json"
        return response

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Log and render an unexpected 500 as a generic JSON envelope."""
        app.logger.error("Unexpected backend failure", exc_info=error.original_exception or error)
        return jsonify(error_payload("internal_error", "An unexpected server error occurred.")), 500

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        """Render any uncaught exception as a generic JSON 500."""
        # Keep API failures JSON even when the local development debugger is on.
        # ApiError and HTTPException use their more specific handlers above.
        app.logger.error("Unexpected backend failure", exc_info=error)
        return jsonify(error_payload("internal_error", "An unexpected server error occurred.")), 500
