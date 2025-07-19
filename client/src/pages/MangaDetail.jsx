import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./MangaDetail.css";

function MangaDetail() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [previousRating, setPreviousRating] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [allReviews, setAllReviews] = useState([]);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const res = await axios.get(`https://api.jikan.moe/v4/manga/${id}`);
        setManga(res.data.data);
        setLoading(false);

        const token = localStorage.getItem("token");
        if (token) {
          const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
            headers: { "x-auth-token": token },
          });

          setBookmarked(userRes.data.bookmarks.includes(id));

          const existing = userRes.data.ratings?.find((r) => r.mangaId === id);
          if (existing) {
            setPreviousRating(existing.score);
            setScore(existing.score);
          }
        }

        const avgRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/average/${id}`);
        if (avgRes.data.average) {
          setAverageRating(avgRes.data.average);
          setRatingsCount(avgRes.data.count);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchManga();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/reviews/${id}`);
        setAllReviews(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchReviews();
  }, [id]);

  const handleBookmark = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in!");

    try {
      if (!bookmarked) {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/bookmarks/add`,
          { mangaId: id },
          { headers: { "x-auth-token": token } }
        );
        setBookmarked(true);
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/bookmarks/remove`,
          { mangaId: id },
          { headers: { "x-auth-token": token } }
        );
        setBookmarked(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in!");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookmarks/review`,
        { mangaId: id, score, review: reviewText },
        { headers: { "x-auth-token": token } }
      );

      setMessage(`You rated this manga ${score} stars${reviewText ? " and left a review!" : "!"}`);
      setPreviousRating(score);
      setReviewText("");

      const avgRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/average/${id}`);
      if (avgRes.data.average) {
        setAverageRating(avgRes.data.average);
        setRatingsCount(avgRes.data.count);
      }

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/reviews/${id}`);
      setAllReviews(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Error submitting rating and review, please give a rating.");
    }
  };

  const handleRemoveRating = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in!");

    if (!window.confirm("Are you sure you want to remove your rating and review?")) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/bookmarks/rating/${id}`, {
        headers: { "x-auth-token": token },
      });

      setMessage("Your rating and review have been removed.");
      setPreviousRating(null);
      setScore(0);
      setReviewText("");

      const avgRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/average/${id}`);
      if (avgRes.data.average) {
        setAverageRating(avgRes.data.average);
        setRatingsCount(avgRes.data.count);
      }

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/reviews/${id}`);
      setAllReviews(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Error removing rating and review.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!manga) return <p>Manga not found.</p>;

  return (
    <div className="detail-container">
      <div className="manga-detail-card">
        <h2 className="detail-title">{manga.title}</h2>
        <img
          src={manga.images.jpg.large_image_url}
          alt={manga.title}
          className="detail-image"
        />
        <p><strong>MAL Score:</strong> {manga.score || "N/A"}</p>
        <p><strong>Synopsis:</strong> {manga.synopsis || "No synopsis available."}</p>
        <p><strong>Genres:</strong> {manga.genres.map((g) => g.name).join(", ")}</p>
        <p>
  <strong>More info and Where to Read On:</strong>{" "}
  <a href={manga.url} target="_blank" rel="noopener noreferrer" className="read-link">
    Official MAL Page
  </a>
</p>
        <button onClick={handleBookmark} className="bookmark-button">
          {bookmarked ? "Remove Bookmark" : "Add Bookmark"}
        </button>

        <div className="rating-section">
          <p>Rate this manga:</p>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setScore(value)}
              className={`star-button ${score >= value ? "filled" : ""}`}
            >
              ⭐
            </button>
          ))}

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review here... (optional)"
            rows="4"
          ></textarea>

          <div className="rating-actions">
            <button onClick={handleSubmit} className="submit-button">
              Submit Rating
            </button>
            {previousRating && (
              <button onClick={handleRemoveRating} className="remove-button">
                Remove My Rating
              </button>
            )}
          </div>

          <p>{message}</p>

          {previousRating && (
            <p style={{ color: "green" }}>You previously rated this: {previousRating} ⭐</p>
          )}

          {averageRating ? (
            <p>⭐ Average user rating: {averageRating} / 5 (based on {ratingsCount} user{ratingsCount !== 1 ? "s" : ""})</p>
          ) : (
            <p>No user ratings yet.</p>
          )}
        </div>
      </div>

      <h3>Community Reviews</h3>
      <div className="reviews-section">
        {allReviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          allReviews.map((r, index) => (
            <div key={index} className="review-card">
              <p><strong>{r.username}</strong> rated it {r.score} ⭐</p>
              <p>{r.review}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MangaDetail;
