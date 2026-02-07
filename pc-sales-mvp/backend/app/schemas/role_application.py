from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RoleApplicationCreate(BaseModel):
    role_name: str
    reason: Optional[str] = None

class RoleApplicationResponse(BaseModel):
    id: int
    user_id: int
    username: str
    role_name: str
    status: str
    reason: Optional[str]
    admin_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class RoleApplicationUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
