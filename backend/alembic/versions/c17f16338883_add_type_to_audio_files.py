"""add_type_to_audio_files

Revision ID: c17f16338883
Revises: add_language_field
Create Date: 2024-11-23 18:24:40.841379

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c17f16338883'
down_revision: Union[str, None] = 'add_language_field'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audio_files', sa.Column('type', sa.String(), nullable=True, server_default='full'))
    op.execute("UPDATE audio_files SET type = 'full' WHERE type IS NULL")


def downgrade() -> None:
    op.drop_column('audio_files', 'type')
