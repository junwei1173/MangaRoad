import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [mangaDetails, setMangaDetails] = useState([]);
  const [ratedMangaDetails, setRatedMangaDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view profiles");
        setLoading(false);
        return;
      }

      try {
        const currentUserRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth/user`,
          { headers: { "x-auth-token": token } }
        );
        const currentUser = currentUserRes.data;
        setCurrentUserId(currentUser.id);
        setIsFollowing(currentUser.following?.includes(userId) || false);

        const userRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth/${userId}/public`,
          { headers: { "x-auth-token": token } }
        );
        setUser(userRes.data);
      } catch (err) {
        if (err.response?.status === 404) setError("User not found");
        else setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      if (!user?.bookmarks?.length) {
        setMangaDetails([]);
        return;
      }
      try {
        const results = await Promise.all(
          user.bookmarks.map((id) =>
            axios
              .get(`https://api.jikan.moe/v4/manga/${id}`)
              .then((res) => res.data.data)
              .catch(() => null)
          )
        );
        setMangaDetails(results.filter(Boolean));
      } catch {
        setMangaDetails([]);
      }
    };
    fetchMangaDetails();
  }, [user?.bookmarks]);

  useEffect(() => {
    const fetchRatedMangaDetails = async () => {
      if (!user?.ratings?.length) {
        setRatedMangaDetails([]);
        return;
      }
      try {
        const results = await Promise.all(
          user.ratings.map(async (rating) => {
            try {
              const res = await axios.get(
                `https://api.jikan.moe/v4/manga/${rating.mangaId}`
              );
              return {
                ...res.data.data,
                userRating: rating.score || rating.rating || 0,
              };
            } catch {
              return null;
            }
          })
        );
        setRatedMangaDetails(results.filter(Boolean));
      } catch {
        setRatedMangaDetails([]);
      }
    };
    fetchRatedMangaDetails();
  }, [user?.ratings]);

  const handleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/follow/${userId}`,
        null,
        { headers: { "x-auth-token": token } }
      );
      setIsFollowing(true);
    } catch (err) {
      alert(
        err.response?.data?.msg || "Failed to follow user"
      );
    }
  };

  const handleUnfollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/unfollow/${userId}`,
        null,
        { headers: { "x-auth-token": token } }
      );
      setIsFollowing(false);
    } catch {
      alert("Failed to unfollow user");
    }
  };

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  const displayName =
    user.username?.trim() || user.name || user.email || "[No Username]";
  const isOwnProfile = currentUserId === userId;

  if (!displayName && !isOwnProfile) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        <h2>Profile Unavailable</h2>
        <p>This user profile is not properly set up.</p>
        <Link to="/users" style={{ color: "#007bff" }}>
          ← Back to Users
        </Link>
      </div>
    );
  }

  // Shared styles for manga cards
  const cardStyle = {
    border: "2px solid black",
    borderRadius: "8px",
    backgroundColor: "white",
    boxShadow: "4px 4px 0 black",
    overflow: "hidden",
    textAlign: "center",
    width: "150px",
    padding: "10px",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  };

  const cardHoverStyle = {
    transform: "translate(-4px, -4px)",
    boxShadow: "8px 8px 0 black",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "'Anton', sans-serif" }}>
      <div
        style={{
          marginBottom: "30px",
          borderBottom: "3px solid black",
          paddingBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "2.5rem" }}>{displayName}'s Profile</h1>

        {(!user.username || !user.username.trim()) && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "10px",
              borderRadius: "4px",
              marginTop: "10px",
              color: "#856404",
            }}
          >
            ⚠️ This profile is missing a username
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "10px",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          <span>Followers: {user.followers?.length || 0}</span>
          <span>Following: {user.following?.length || 0}</span>
          <span>Bookmarked: {user.bookmarks?.length || 0}</span>
          <span>Rated: {user.ratings?.length || 0}</span>
        </div>

        {!isOwnProfile && displayName !== "[No Username]" && (
          <div style={{ marginTop: "15px" }}>
            {isFollowing ? (
              <button
                onClick={handleUnfollow}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Unfollow
              </button>
            ) : (
              <button
                onClick={handleFollow}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Follow
              </button>
            )}
          </div>
        )}
      </div>

      <section style={{ marginBottom: "40px" }}>
        <h2
          style={{
            borderBottom: "3px solid black",
            display: "inline-block",
            paddingBottom: "0.5rem",
            fontSize: "1.8rem",
          }}
        >
          {displayName}'s Bookmarked Manga
        </h2>
        {mangaDetails.length === 0 ? (
          <p>No bookmarks yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "20px",
            }}
          >
            {mangaDetails.map((manga) => (
              <Link
                key={manga.mal_id}
                to={`/manga/${manga.mal_id}`}
                style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, cardHoverStyle)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, cardStyle)
                }
              >
                <img
                  src={manga.images.jpg.image_url}
                  alt={manga.title}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <p
                  style={{
                    margin: "8px 0",
                    fontSize: "14px",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {manga.title}
                </p>
                {manga.score && (
                  <p
                    style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}
                  >
                    MAL Score: {manga.score}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2
          style={{
            borderBottom: "3px solid black",
            display: "inline-block",
            paddingBottom: "0.5rem",
            fontSize: "1.8rem",
          }}
        >
          {displayName}'s Rated Manga
        </h2>
        {ratedMangaDetails.length === 0 ? (
          <p>No ratings yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "20px",
            }}
          >
            {ratedMangaDetails.map((manga) => (
              <Link
                key={manga.mal_id}
                to={`/manga/${manga.mal_id}`}
                style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}
                onMouseEnter={(e) =>
                  Object.assign(e.currentTarget.style, cardHoverStyle)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, cardStyle)
                }
              >
                <img
                  src={manga.images.jpg.image_url}
                  alt={manga.title}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <p
                  style={{
                    margin: "8px 0",
                    fontSize: "14px",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {manga.title}
                </p>
                <div
                  style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}
                >
                  <div>User Rating: {manga.userRating || "N/A"}/5</div>
                  {manga.score && <div>MAL Score: {manga.score}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default UserProfile;
