"""Add language field to AudioFile

Revision ID: add_language_field
Revises: 07e773e1cd09
Create Date: 2024-11-23 12:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_language_field'
down_revision = '07e773e1cd09'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('audio_files', sa.Column('language', sa.String(2), nullable=False, server_default='en'))

def downgrade():
    op.drop_column('audio_files', 'language')