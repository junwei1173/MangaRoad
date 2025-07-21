import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trending, setTrending] = useState([]);
  const [username, setUsername] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [justReleased, setJustReleased] = useState([]);


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.username) {
      setUsername(user.username);
    }
  }, []);

  useEffect(() => {
  const fetchManga = async () => {
    const trendingCache = JSON.parse(localStorage.getItem("trending"));
    const releasedCache = JSON.parse(localStorage.getItem("justReleased"));
    const now = Date.now();

    try {
      if (trendingCache && now - trendingCache.timestamp < 10 * 60 * 1000) {
        setTrending(trendingCache.data);
      } else {
        const trendingRes = await axios.get("https://api.jikan.moe/v4/top/manga?limit=8");
        setTrending(trendingRes.data.data);
        localStorage.setItem(
          "trending",
          JSON.stringify({ data: trendingRes.data.data, timestamp: now })
        );
      }

      await new Promise((res) => setTimeout(res, 500));

      if (releasedCache && now - releasedCache.timestamp < 10 * 60 * 1000) {
        setJustReleased(releasedCache.data);
      } else {
        const recentRes = await axios.get("https://api.jikan.moe/v4/manga?order_by=start_date&sort=desc&limit=8");
        setJustReleased(recentRes.data.data);
        localStorage.setItem(
          "justReleased",
          JSON.stringify({ data: recentRes.data.data, timestamp: now })
        );
      }
    } catch (err) {
      console.error("Failed to fetch manga:", err);
    }
  };

  fetchManga();
}, []);




  useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000); // every second
  return () => clearInterval(interval);
}, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDateTime = () => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "medium", // was "short"
  }).format(currentTime);
};

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
  };

  return (
    <div className="home-container">
      <h2 className="greeting-text">{getGreeting()}!</h2>
      <h1 className="home-title">
        Welcome to <span className="highlighted-title">MangaRoad</span>
        {username && <span className="username">, {username}!</span>}
      </h1>
      <p className="date-time">{formatDateTime()}</p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search manga..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      <h2 className="section-title">Trending Picks</h2>
      <div className="trending-grid">
        {trending.map((manga) => (
          <div key={manga.mal_id} className="manga-card">
            <Link to={`/manga/${manga.mal_id}`}>
              <img src={manga.images.jpg.image_url} alt={manga.title} className="manga-image" />
              <p className="manga-title-text">{manga.title}</p>
              {manga.score && <p className="manga-score">MAL Score: {manga.score}</p>}
            </Link>
          </div>
        ))}
        
      </div>
      <h2 className="section-title">Just Released</h2>
<div className="trending-grid">
  {justReleased.map((manga) => (
    <div key={manga.mal_id} className="manga-card">
      <Link to={`/manga/${manga.mal_id}`}>
        <img src={manga.images.jpg.image_url} alt={manga.title} className="manga-image" />
        <p className="manga-title-text">{manga.title}</p>
        {manga.score && <p className="manga-score">MAL Score: {manga.score}</p>}
      </Link>
    </div>
  ))}
</div>

    </div>
  );
}

export default Home;
