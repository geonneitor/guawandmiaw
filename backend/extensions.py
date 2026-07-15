from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
cors = CORS()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per minute"])

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    from backend.models.token_blocklist import TokenBlocklist
    jti = jwt_payload.get('jti')
    return db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar() is not None
