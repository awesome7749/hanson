import React, { useEffect, useState } from "react";
import { LIVE } from "./deployment";

interface ReviewsSummary {
  rating: number;
  count: number;
  reviews: { author: string; rating: number; text: string; when: string }[];
  writeReviewUrl: string;
  mapsUrl: string;
}

const SAMPLE: ReviewsSummary = {
  rating: 4.9,
  count: 27,
  reviews: [
    {
      author: "Sample review",
      rating: 5,
      text: "The quote was exactly what we paid — no surprises. The crew protected the floors and walked us through the controls before leaving.",
      when: "2 weeks ago",
    },
    {
      author: "Sample review",
      rating: 5,
      text: "Upstairs finally stays warm in January. They handled the Mass Save paperwork and the rebate arrived as described.",
      when: "a month ago",
    },
    {
      author: "Sample review",
      rating: 5,
      text: "Clear communication from the first call to the final walkthrough. Would recommend to any homeowner considering a heat pump.",
      when: "2 months ago",
    },
  ],
  writeReviewUrl: "#",
  mapsUrl: "#",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= Math.round(rating) ? "filled" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

// Google Business Profile reviews. In the live build this renders only when
// the server has GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID configured; the
// preview shows sample content so the section can be designed and reviewed.
export default function GoogleReviews() {
  const [data, setData] = useState<ReviewsSummary | null>(LIVE ? null : SAMPLE);
  useEffect(() => {
    if (!LIVE) return;
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.configured !== false && d.rating) setData(d);
      })
      .catch(() => {});
  }, []);
  if (!data) return null;
  const sample = !LIVE;
  return (
    <section className="section wrap reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-header">
        <div>
          <span className="eyebrow">FROM MASSACHUSETTS HOMEOWNERS</span>
          <h2 id="reviews-heading">
            What our customers
            <br />
            say on Google.
          </h2>
        </div>
        <div className="reviews-score">
          <strong>{data.rating.toFixed(1)}</strong>
          <div>
            <Stars rating={data.rating} />
            <span>
              {data.count} Google review{data.count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
      <div className="reviews-grid">
        {data.reviews.map((review, i) => (
          <blockquote className="review-card" key={i}>
            <Stars rating={review.rating} />
            <p>“{review.text}”</p>
            <footer>
              {review.author}
              {review.when && <span> · {review.when}</span>}
            </footer>
          </blockquote>
        ))}
      </div>
      <div className="inline-actions">
        {sample ? <button className="button" type="button" disabled>Review us on Google</button> :
          <a className="button" href={data.writeReviewUrl} target="_blank" rel="noreferrer">Review us on Google</a>}
        {sample ? <button className="text-link" type="button" disabled>See all reviews <span aria-hidden="true">↗</span></button> :
          <a className="text-link" href={data.mapsUrl} target="_blank" rel="noreferrer">See all reviews <span aria-hidden="true">↗</span></a>}
      </div>
      {sample && (
        <p className="reviews-sample-note">
          Preview only: live Google reviews appear here once the listing is
          connected.
        </p>
      )}
    </section>
  );
}
