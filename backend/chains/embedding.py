# backend/chains/embedding.py

import os
from google import genai
from dotenv import load_dotenv
from clients.pinecone_client import upsert_review_embedding
from clients.supabase_client import supabase
import logging # Add logging

load_dotenv()
logging.basicConfig(level=logging.INFO) # Add basic logging

# Use a documented model, e.g., text-embedding-004 or the experimental one
# Check Gemini docs for latest recommended model and its dimension (might not be 1024)
EMBED_MODEL = "models/text-embedding-004"
# Make sure your Pinecone index dimension matches this model's output dimension!

def embed_and_store(review_id: str, text: str, metadata: dict):
    """
    1) Call Gemini to get embeddings using embed_content
    2) Upsert into Pinecone
    3) Insert embedding metadata into Supabase
    """
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        # 1) Use embed_content
        embed_resp = client.embed_content( # Corrected method name
            model=EMBED_MODEL,
            content=text, # Use 'content' not 'input'
            task_type="RETRIEVAL_DOCUMENT" # Specify task type for potentially better embeddings
        )
        # Assuming the response structure holds embeddings directly
        # Verify the actual response structure from google-genai docs if needed
        if 'embedding' not in embed_resp:
             logging.error(f"Embedding failed for review {review_id}. Response: {embed_resp}")
             return # Or raise an exception

        vector = embed_resp['embedding'] # Access the embedding vector

        # Ensure vector is a list of floats (it should be, but good practice)
        if not isinstance(vector, list) or not all(isinstance(x, float) for x in vector):
            logging.error(f"Unexpected embedding format for review {review_id}: {type(vector)}")
            return # Or raise

        logging.info(f"Generated embedding for review {review_id}, dimension: {len(vector)}")

        # 2) upsert to Pinecone
        upsert_review_embedding(review_id, vector, metadata)
        logging.info(f"Upserted embedding to Pinecone for review {review_id}")

        # 3) store in Supabase embeddings table
        # Make sure the 'vector' column in Supabase matches the dimension
        response = supabase.table("embeddings").insert({
            "review_id": review_id,
            "vector": vector, # Storing the vector itself
            "service": metadata.get("service"),
            "location": metadata.get("location"),
            "product": metadata.get("product"),
        }).execute()
        logging.info(f"Stored embedding metadata in Supabase for review {review_id}")

        # Optional: Check Supabase response for errors
        # if hasattr(response, 'error') and response.error:
        #    logging.error(f"Supabase insert error for embedding {review_id}: {response.error}")

    except Exception as e:
        logging.error(f"Error in embed_and_store for review {review_id}: {e}", exc_info=True)
        # Decide if you want to re-raise the exception or just log it
