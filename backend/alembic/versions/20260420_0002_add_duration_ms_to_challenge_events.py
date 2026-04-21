"""add duration_ms to challenge_events

Revision ID: 20260420_0002
Revises: 20260420_0001
Create Date: 2026-04-20 20:21:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "20260420_0002"
down_revision: Union[str, None] = "20260420_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("challenge_events")}
    if "duration_ms" not in columns:
        op.add_column("challenge_events", sa.Column("duration_ms", sa.Integer(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("challenge_events")}
    if "duration_ms" in columns:
        op.drop_column("challenge_events", "duration_ms")
