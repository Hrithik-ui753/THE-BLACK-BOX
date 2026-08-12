import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from config import DEFAULT_BATTERY_ID
from services.azure_service import azure_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["Azure OpenAI Battery Chatbot"])


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    battery_id: Optional[str] = DEFAULT_BATTERY_ID
    cell_index: Optional[int] = None
    history: Optional[List[ChatMessageItem]] = []


class ChatResponse(BaseModel):
    reply: str
    status: str = "success"
    battery_id: str


@router.post("/analyze", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse)
def analyze_battery_with_ai(payload: ChatRequest):
    """
    Receives user message and calls server-side Azure OpenAI model with real
    battery context (telemetry, features, predictions, alerts, history).
    """
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="User message cannot be empty.")

    battery_id = payload.battery_id or DEFAULT_BATTERY_ID

    history_dicts = [{"role": h.role, "content": h.content} for h in payload.history] if payload.history else []

    reply = azure_service.generate_chat_response(
        user_message=user_msg,
        battery_id=battery_id,
        history=history_dicts,
        cell_index=payload.cell_index
    )

    return ChatResponse(
        reply=reply,
        status="success",
        battery_id=battery_id
    )
