import { PineconeClient } from "@pinecone-database/pinecone";

const client = new PineconeClient();

(async () => {
  await client.init({
    apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
    environment: process.env.NEXT_PUBLIC_PINECONE_ENV,
  });
})();

export const index = client.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);

export async function querySimilar(vector, topK = 5) {
  const response = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });
  return response.matches;
}
