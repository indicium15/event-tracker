# futsal/routes.py
from shared.blueprint_factory import make_sport_blueprint
from shared.sport_config import SPORTS

bp = make_sport_blueprint(SPORTS["futsal"], __name__)
