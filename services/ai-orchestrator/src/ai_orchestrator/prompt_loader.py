"""Loader for markdown system prompts and skill instructions.
@see docs/07-ai-orchestrator.md
"""

from pathlib import Path
from typing import Dict

PROMPTS_DIR = Path(__file__).parent / "prompts"

_PROMPT_CACHE: Dict[str, str] = {}


def load_prompt(name: str) -> str:
    """Load system prompt markdown content by basename (e.g. 'intent_classifier')."""
    if name in _PROMPT_CACHE:
        return _PROMPT_CACHE[name]

    filename = f"{name}.md" if not name.endswith(".md") else name
    filepath = PROMPTS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Prompt file not found: {filepath}")

    content = filepath.read_text(encoding="utf-8").strip()
    _PROMPT_CACHE[name] = content
    return content
