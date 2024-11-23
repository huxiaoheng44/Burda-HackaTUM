"""add_crew_results_table

Revision ID: ff56ae82308f
Revises: add_language_field
Create Date: 2024-11-23 16:05:06.129884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff56ae82308f'
down_revision: Union[str, None] = 'add_language_field'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'crew_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=True),
        sa.Column('parsed_data', sa.Text(), nullable=True),
        sa.Column('enriched_data', sa.Text(), nullable=True),
        sa.Column('ranked_data', sa.Text(), nullable=True),
        sa.Column('final_content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.current_timestamp(), nullable=True),
        sa.ForeignKeyConstraint(['article_id'], ['news_articles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('crew_results')
