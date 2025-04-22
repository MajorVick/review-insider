# backend/clients/gemini_llm.py

import os
from dotenv import load_dotenv
from google import genai
from langchain.llms.base import LLM
from typing import Optional, List

load_dotenv()

class GeminiLLM(LLM):
    """A LangChain-compatible wrapper around google-genai Client.generate_content."""

    def __init__(self, model: str = "gemini-2.0-flash"):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model  = model

    @property
    def _llm_type(self) -> str:
        return "gemini"

    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        resp = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        return resp.text
