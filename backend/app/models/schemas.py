from typing import Dict, List, Optional

from pydantic import BaseModel


class ChannelInfo(BaseModel):
    channel_id: str
    channel_slug: str
    channel_name: str
    channel_number: str
    chlogo: str

class ProgramInfo(BaseModel):
    start_time: str
    start: str
    end_time: str
    end: str
    length: str
    channel: str
    title: str
    category: Optional[str]
    episode: Optional[str]

class SourceInfo(BaseModel):
    id: str
    name: str
    url: str
