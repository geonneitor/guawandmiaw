from backend.extensions import db
from datetime import datetime, timezone
from backend.utils.timezone import get_local_now, get_local_date

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: get_local_now())

    def __init__(self, **kwargs):
        super(TokenBlocklist, self).__init__(**kwargs)
