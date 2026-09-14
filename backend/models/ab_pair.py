"""
The one recurring domain relationship: two comparable values, A and B, where
either side may genuinely be missing. `status` is derived, not stored, so it
can never drift from A/B.
"""

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, computed_field

# Generic type
T = TypeVar("T")


def ab_status(a, b) -> str:
    if a is not None and b is not None:
        return "complete"
    if a is None:
        return "missing_a"
    return "missing_b"


class ABPair(BaseModel, Generic[T]):
    A: Optional[T] = None
    B: Optional[T] = None

    @computed_field
    @property
    def status(self) -> str:
        return ab_status(self.A, self.B)
