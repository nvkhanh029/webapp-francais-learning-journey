
from .auth import bp as auth_bp
from .conjugation import bp as conjugation_bp
from .grammar import bp as grammar_bp
from .me import bp as me_bp
from .practice import bp as practice_bp
from .references import bp as references_bp
from .vocabulary import bp as vocabulary_bp


def register_blueprints(app):
    for blueprint in (
        auth_bp,
        me_bp,
        grammar_bp,
        vocabulary_bp,
        conjugation_bp,
        references_bp,
        practice_bp,
    ):
        app.register_blueprint(blueprint)
