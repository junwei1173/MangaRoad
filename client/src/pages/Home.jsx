import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Home.css"; 

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trending, setTrending] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.username) {
      setUsername(user.username);
    }
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get("https://api.jikan.moe/v4/top/manga?limit=8");
        setTrending(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTrending();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
  };

  return (
    <div className="home-container">
      <h1 className="home-title">
  Welcome to <span className="highlighted-title">MangaRoad</span>
  {username && <span className="username">, {username}!</span>}
</h1>


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

      <h2 className="section-title"> Trending Picks</h2>
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
    </div>
  );
}

export default Home;
