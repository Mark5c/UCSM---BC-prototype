from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, List, Any


# ── Sub-models ────────────────────────────────────────────────────────────────

class Step(BaseModel):
    id: str
    order: int
    text: str


class AlternativeFlow(BaseModel):
    id: str
    label: str
    name: str = ''
    condition: str
    steps: List[Step] = []
    triggered_by_step_id: Optional[str] = None


# ── Use Case ──────────────────────────────────────────────────────────────────

class UseCaseBase(BaseModel):
    name: str
    template_type: Literal["cockburn", "jacobson"]
    primary_actor: str = ""
    supporting_actors: List[str] = []
    goal: str = ""
    preconditions: List[str] = []
    postconditions: List[str] = []
    main_flow: List[Step] = []
    alternative_flows: List[AlternativeFlow] = []
    template_extras: dict = {}
    updated_by: str = "anonymous"


class UseCaseCreate(UseCaseBase):
    group_id: Optional[str] = None


class UseCaseUpdate(UseCaseBase):
    version: int
    # group_id intentionally omitted — group changes go through PATCH /group endpoint


class UseCaseResponse(UseCaseBase):
    id: str
    project_id: str
    version: int
    updated_at: str
    group_id: Optional[str] = None

    model_config = {"from_attributes": True}


class UseCaseMoveGroup(BaseModel):
    group_id: Optional[str] = None


# ── Use Case Groups ───────────────────────────────────────────────────────────

class UseCaseGroupCreate(BaseModel):
    name: str
    position: int = 0


class UseCaseGroupUpdate(BaseModel):
    name: str
    position: int = 0


class UseCaseGroupResponse(BaseModel):
    id: str
    project_id: str
    name: str
    position: int

    model_config = {"from_attributes": True}


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    visibility: Literal["private", "link", "public"] = "private"


class ProjectResponse(ProjectBase):
    id: str
    owner_id: Optional[str] = None
    visibility: Literal["private", "link", "public"] = "private"
    share_token: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── History ───────────────────────────────────────────────────────────────────

class HistoryEntryResponse(BaseModel):
    id: str
    project_id: str
    use_case_id: Optional[str] = None
    user_id: Optional[str] = None
    username: str
    action: Literal["created", "updated", "deleted"]
    target_type: Literal["use_case", "relationship", "project"]
    target_name: Optional[str] = None
    timestamp: str
    changed_fields: Optional[List[str]] = None


# ── Relationship ──────────────────────────────────────────────────────────────

class RelationshipCreate(BaseModel):
    source_id: str
    target_id: str
    type: Literal["include", "extend"]
    note: Optional[str] = None


class RelationshipResponse(RelationshipCreate):
    id: str
    project_id: str

    model_config = {"from_attributes": True}


# ── Validation ────────────────────────────────────────────────────────────────

class ValidationIssue(BaseModel):
    field: str
    message: str
    severity: Literal["error", "warning"]


class ValidationResult(BaseModel):
    issues: List[ValidationIssue]


# ── WebSocket ─────────────────────────────────────────────────────────────────

class WSEvent(BaseModel):
    type: str
    payload: Any
    version: int = 0
    updated_by: str = "anonymous"
    timestamp: str
