# backend/app.py

import os
from flask import Flask, request, jsonify
from clients.supabase_client import supabase
# Remove unused import: from clients.pinecone_client import upsert_review_embedding
from chains.embedding import embed_and_store
from chains.sentiment import analyze_sentiment
from chains.classification import classify_review
import logging # Add logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route("/webhook/reviews", methods=["POST"])
def webhook_reviews():
    logging.info("Received webhook request")
    try:
        payload = request.get_json()
        if not payload:
            logging.error("Webhook received empty payload")
            return jsonify({"error": "Empty payload"}), 400

        # Basic validation for required fields
        required_fields = ["id", "text", "review_date"]
        if not all(field in payload for field in required_fields):
             missing = [f for f in required_fields if f not in payload]
             logging.error(f"Webhook missing required fields: {missing}")
             return jsonify({"error": f"Missing fields: {missing}"}), 400

        review_id   = payload["id"]
        text        = payload["text"]
        review_date = payload["review_date"]
        metadata    = payload.get("metadata", {}) # Safely get metadata

        logging.info(f"Processing review ID: {review_id}")

        # 1) Insert raw review into Supabase
        insert_response = supabase.table("reviews").insert({
            "id":          review_id,
            "text":        text,
            "review_date": review_date,
            "metadata":    metadata
        }).execute()

        # Optional: Check Supabase insert response
        # if hasattr(insert_response, 'error') and insert_response.error:
        #    logging.error(f"Supabase insert error for review {review_id}: {insert_response.error}")
        #    return jsonify({"error": "Failed to store review"}), 500

        logging.info(f"Stored raw review {review_id} in Supabase.")

        # 2) Fire off downstream chains (consider running these in background tasks later for performance)
        # For now, run sequentially
        embed_and_store(review_id, text, metadata)
        analyze_sentiment(review_id, text)
        classify_review(review_id, text, buckets="Service,Location,Product") # Pass buckets explicitly if needed

        logging.info(f"Finished processing chains for review {review_id}")
        return jsonify({"status": "ok"}), 200

    except Exception as e:
        logging.error(f"Unhandled error in webhook_reviews: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080)) # Use 8080 common for cloud run/app engine
    # Set debug=False for production environments
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "False") == "True")
