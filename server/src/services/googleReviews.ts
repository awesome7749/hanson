// Google Business Profile reviews for the homepage. Reads the Places API
// (New) with a server-side key and caches the result, so the browser never
// sees the key and page loads never wait on Google. Disabled (returns null)
// until GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are configured.

export interface ReviewsSummary {
  rating: number;
  count: number;
  reviews: { author: string; rating: number; text: string; when: string }[];
  writeReviewUrl: string;
  mapsUrl: string;
}

export interface GoogleReviews {
  getSummary(): Promise<ReviewsSummary>;
}

const CACHE_MS = 6 * 60 * 60 * 1000;

export function createGoogleReviews(env: NodeJS.ProcessEnv = process.env): GoogleReviews | null {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;
  let cached: ReviewsSummary | null = null;
  let cachedAt = 0;
  return {
    async getSummary() {
      if (cached && Date.now() - cachedAt < CACHE_MS) return cached;
      const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri',
        },
      });
      if (!response.ok) {
        if (cached) return cached; // serve stale rather than fail the page
        throw new Error(`Places API responded ${response.status}`);
      }
      const place = await response.json() as {
        rating?: number; userRatingCount?: number; googleMapsUri?: string;
        reviews?: { rating?: number; relativePublishTimeDescription?: string; text?: { text?: string }; authorAttribution?: { displayName?: string } }[];
      };
      cached = {
        rating: place.rating || 0,
        count: place.userRatingCount || 0,
        reviews: (place.reviews || [])
          .filter(r => r.text?.text)
          .slice(0, 3)
          .map(r => ({
            author: r.authorAttribution?.displayName || 'A Google user',
            rating: r.rating || 0,
            text: (r.text?.text || '').slice(0, 400),
            when: r.relativePublishTimeDescription || '',
          })),
        writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`,
        mapsUrl: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`,
      };
      cachedAt = Date.now();
      return cached;
    },
  };
}
