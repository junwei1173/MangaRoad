import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const [bookmarks, setBookmarks] = useState([]);
  const [mangaDetails, setMangaDetails] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followerUsers, setFollowerUsers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    const fetchUserData = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
      headers: { "x-auth-token": token },
    });

    setIsLoggedIn(true);
    setBookmarks(res.data.bookmarks || []);
    setFollowers(res.data.followers || []);
    setFollowing(res.data.following || []);
  } catch (err) {
    console.error("Error fetching user data:", err);
    setIsLoggedIn(false);
  }
};


    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      if (bookmarks.length === 0) {
        setMangaDetails([]);
        return;
      }

      try {
        const detailPromises = bookmarks.map((id) =>
          axios.get(`https://api.jikan.moe/v4/manga/${id}`).then((res) => res.data.data)
        );

        const results = await Promise.all(detailPromises);
        setMangaDetails(results);
      } catch (err) {
        console.error("Error fetching manga details:", err);
      }
    };

    fetchMangaDetails();
  }, [bookmarks]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookmarks/recommendations`, {
          headers: { "x-auth-token": token },
        });

        setRecommendations(res.data.recommendations || []);
        setRecommendationReason(res.data.reason || "");
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };

    fetchRecommendations();
  }, []);

  const handleRemove = async (mangaId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookmarks/remove`,
        { mangaId },
        {
          headers: { "x-auth-token": token },
        }
      );

      setBookmarks((prev) => prev.filter((id) => String(id) !== String(mangaId)));
      setMangaDetails((prev) => prev.filter((manga) => String(manga.mal_id) !== String(mangaId)));
    } catch (err) {
      console.error("Error removing bookmark:", err);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/unfollow/${targetUserId}`,
        null,
        {
          headers: { "x-auth-token": token },
        }
      );

      setFollowing((prev) => prev.filter((id) => id !== targetUserId));
      setFollowingUsers((prev) => prev.filter((user) => user._id !== targetUserId));
    } catch (err) {
      console.error("Unfollow failed", err);
      alert("Failed to unfollow user");
    }
  };

  useEffect(() => {
    const fetchUsernames = async (userIds, setUsers) => {
      if (!userIds.length) {
        setUsers([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/users`, {
          params: { ids: userIds.join(",") },
          headers: { "x-auth-token": token },
        });

        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        setUsers([]);
      }
    };

    fetchUsernames(following, setFollowingUsers);
    fetchUsernames(followers, setFollowerUsers);
  }, [following, followers]);

  if (!isLoggedIn) {
  return <div className="profile-container"><p>Please log in to view your profile.</p></div>;
}

  return (
    <div className="profile-container">
      <section className="profile-section">
        <h2>My Bookmarks</h2>
        {mangaDetails.length === 0 ? (
          <p>No bookmarks yet.</p>
        ) : (
          <div className="manga-grid">
            {mangaDetails.map((manga) => (
              <div key={manga.mal_id} className="manga-card">
                <Link to={`/manga/${manga.mal_id}`} className="manga-link">
                  <img src={manga.images.jpg.image_url} alt={manga.title} />
                  <p>{manga.title}</p>
                </Link>
                <button onClick={() => handleRemove(manga.mal_id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2>Recommended For You</h2>
        {recommendationReason && (
          <p className="recommendation-reason">{recommendationReason}</p>
        )}
        {recommendations.length === 0 ? (
          <p>No recommendations yet. Try bookmarking or rating manga!</p>
        ) : (
          <div className="manga-grid">
            {recommendations.map((manga) => (
              <div key={manga.id} className="manga-card">
                <Link to={`/manga/${manga.id}`} className="manga-link">
                  <img src={manga.image} alt={manga.title} />
                  <p>{manga.title}</p>
                  {manga.score && <p className="manga-score">MAL Score: {manga.score}</p>}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2>Following ({following.length})</h2>
        {followingUsers.length === 0 ? (
          <p>You're not following anyone yet.</p>
        ) : (
          <ul className="user-list">
            {followingUsers.map((user) => (
              <li key={user._id} className="user-item">
                <Link to={`/user/${user._id}`}>{user.username}</Link>
                <button onClick={() => handleUnfollow(user._id)}>Unfollow</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-section">
        <h2>Followers ({followers.length})</h2>
        {followerUsers.length === 0 ? (
          <p>No followers yet.</p>
        ) : (
          <ul className="user-list">
            {followerUsers.map((user) => (
              <li key={user._id} className="user-item">
                <Link to={`/user/${user._id}`}>{user.username}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Profile;
