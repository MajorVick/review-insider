# backend/chains/summary.py

from datetime import datetime, timedelta
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from clients.supabase_client import supabase
from clients.gemini_llm import GeminiLLM

PROMPT = PromptTemplate(
    template=(
        "Generate a weekly summary report of the following customer reviews. "
        "Include: Good vs. Bad breakdown, key phrases, and 3–5 action items. "
        "Reviews:\n\n{context}"
    ),
    input_variables=["context"],
)

llm = GeminiLLM(model="gemini-2.0-flash")

def generate_weekly_summary():
    """Fetch last 7 days of reviews, run LLM chain, return the summary text."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    resp = supabase.table("reviews") \
        .select("text") \
        .gte("created_at", week_ago.isoformat()) \
        .execute()
    texts = [r["text"] for r in resp.data]
    context = "\n".join(f"- {t}" for t in texts)

    chain = LLMChain(llm=llm, prompt=PROMPT)
    return chain.run(context=context)
