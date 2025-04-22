# backend/chains/topic.py

import json
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from clients.pinecone_client import query_similar
from clients.supabase_client import supabase
from clients.gemini_llm import GeminiLLM
import logging

logging.basicConfig(level=logging.INFO)

# Extract top 5 themes from a blob of reviews
PROMPT = PromptTemplate(
    template=(
        "Here are some customer reviews:\n\n{context}\n\n"
        "Extract the top {k} themes or topics as a JSON list."
    ),
    input_variables=["context", "k"],
)

llm = GeminiLLM(model="gemini-2.0-flash")


def extract_and_store_topics(k: int = 5, sample_size: int = 50):
    """
    1) Fetch recent reviews for context
    2) Build prompt + run chain
    3) Store each topic in Supabase.topics with all review IDs
    """
    try:
        # 1) fetch sample reviews
        resp = supabase.table("reviews").select("id,text").limit(sample_size).execute()
        # Add error checking for Supabase fetch
        if not hasattr(resp, 'data'):
             logging.error(f"Failed to fetch reviews for topic extraction. Response: {resp}")
             return

        rows = resp.data
        if not rows:
            logging.info("No reviews found for topic extraction.")
            return

        context = "\n".join(f"- {r['text']}" for r in rows)
        review_ids = [r["id"] for r in rows] # Get review IDs *before* potential error

        # 2) run LLMChain for topics
        chain = LLMChain(llm=llm, prompt=PROMPT)
        output = chain.run(context=context, k=str(k))
        logging.info(f"Raw topic output: {output}")

        # Add try-except for JSON parsing
        try:
            topics = json.loads(output)
            if not isinstance(topics, list) or not all(isinstance(t, str) for t in topics):
                raise ValueError("Invalid JSON list structure received from LLM for topics")
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logging.error(f"Failed to parse topics JSON: {e}. Output was: {output}")
            return # Skip storing topics if parsing fails

        # 3) store topics
        logging.info(f"Extracted topics: {topics}")
        for label in topics:
            supabase.table("topics").insert({
                "label": label,
                "review_ids": review_ids, # Storing all sampled IDs per topic (simplification)
            }).execute()
        logging.info(f"Stored {len(topics)} topics in Supabase.")

    except Exception as e:
        logging.error(f"Error in extract_and_store_topics: {e}", exc_info=True)


