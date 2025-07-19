import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Search.css";

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get("q") || "";

  // Controlled inputs
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sort, setSort] = useState("");

  // Results & pagination
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSearchTerm, setActiveSearchTerm] = useState(queryParam);

  const [luckyManga, setLuckyManga] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);



  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get("https://api.jikan.moe/v4/genres/manga");
        setGenres(res.data.data);
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };
    fetchGenres();
  }, []);

  // Fetch manga function, called only on explicit search
const fetchManga = async (pageNum = 1, append = false, ignoreSearchTerm = false) => {
  setLoading(true);

  const baseURL = "https://api.jikan.moe/v4/manga";
  const params = new URLSearchParams();

  // Add search term if not ignoring it
  if (!ignoreSearchTerm && searchTerm.trim()) {
    params.append("q", searchTerm.trim());
  }

  if (selectedGenre) params.append("genres", selectedGenre);
  if (selectedYear) params.append("start_date", `${selectedYear}-01-01`);
  if (sort === "popularity") params.append("order_by", "members");
  if (sort === "score") params.append("order_by", "score");
  if (sort) params.append("sort", "desc");

  params.append("limit", 7);
  params.append("page", pageNum);

  try {
    const res = await axios.get(`${baseURL}?${params.toString()}`);
    const fetched = res.data.data || [];

   
    const uniqueResults = Array.from(
      new Map(fetched.map(m => [m.mal_id, m])).values()
    );

    
    if (append) {
      setResults(prev => [...prev, ...uniqueResults]);
    } else {
      setResults(uniqueResults);
    }

    setHasMore(uniqueResults.length === 7);
    setPage(pageNum);
  } catch (err) {
    console.error("Error fetching manga:", err);
  } finally {
    setLoading(false);
  }
};




  // Search button handler for text input search
  const handleSearchSubmit = (e) => {
  e.preventDefault();
  setLuckyManga(null);
  fetchManga(1, false);
  setActiveSearchTerm(searchTerm.trim());
  if (searchTerm.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  } else {
    navigate("/search");
  }
};



const handleFilterSearch = () => {
  setLuckyManga(null);
  fetchManga(1, false, true); // ignore search term in fetch
  setActiveSearchTerm("");    // clear active search term since filter search ignores input
  navigate("/search");
};


  // Show more results button
  const handleShowMore = () => {
    fetchManga(page + 1, true);
  };

  const handleClearFilters = () => {
    setSelectedGenre("");
    setSelectedYear("");
    setSort("");
    setSearchTerm("");
    setResults([]);
    navigate("/search");
  };

  const handleFeelingLucky = async () => {
  setLoading(true);
  try {
    const res = await axios.get("https://api.jikan.moe/v4/random/manga?sfw=false");
    const manga = res.data.data;
    setLuckyManga(manga);
    setIsRevealed(false); // reset reveal state
    setResults([]);
    setActiveSearchTerm("🎲 Lucky Pick");
  } catch (err) {
    console.error("Error fetching random manga:", err);
    alert("Failed to get a random manga. Try again!");
  } finally {
    setLoading(false);
  }
};

const isNSFW = (manga) => {
  const nsfwTags = ["Hentai", "Ecchi", "Erotica", "Adult"];
  return manga.genres.some((genre) => nsfwTags.includes(genre.name));
};




  return (
    <div className="search-container">
      <h2 className="search-title">🔍 Search Manga</h2>

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search manga by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      <div className="filter-container" style={{ marginTop: 20, marginBottom: 20 }}>
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="filter-select"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.mal_id} value={genre.mal_id}>
              {genre.name}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="filter-select"
        >
          <option value="">All Years</option>
          {Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="filter-select"
        >
          <option value="">Sort By</option>
          <option value="popularity">Popularity</option>
          <option value="score">Score</option>
        </select>

        <button
          onClick={handleFilterSearch}
          className="search-by-filters-button"
          type="button"
        >
          Search by Filters
        </button>

        <button
          onClick={handleClearFilters}
          className="clear-filters-button"
          type="button"
        >
          Clear All Filters
        </button>

        <button
  onClick={handleFeelingLucky}
  className="lucky-button"
  type="button"
>
  🎲 I'm Feeling Lucky
</button>


      </div>

     {luckyManga && (
  <>
    <h3 className="subtitle">🎯 Your Lucky Manga!</h3>
    <div className="lucky-card-container">
      {(!isNSFW(luckyManga) || isRevealed) ? (
        <Link to={`/manga/${luckyManga.mal_id}`} className="lucky-card">
          <div>
            <div className="lucky-banner">🍀 Lucky Pick!</div>
            <img
              src={luckyManga.images.jpg.image_url}
              alt={luckyManga.title}
              className="lucky-image"
            />
            <p className="lucky-title">{luckyManga.title}</p>
            {luckyManga.score && (
              <p className="lucky-score">⭐ MAL Score: {luckyManga.score}</p>
            )}
          </div>
        </Link>
      ) : (
        <div className="lucky-card blurred">
          <div className="lucky-banner">🍀 Lucky Pick!</div>
          <img
            src={luckyManga.images.jpg.image_url}
            alt={luckyManga.title}
            className="lucky-image"
          />
          <p className="lucky-title">{luckyManga.title}</p>
          {luckyManga.score && (
            <p className="lucky-score">⭐ MAL Score: {luckyManga.score}</p>
          )}
        </div>
      )}

      {isNSFW(luckyManga) && !isRevealed && (
        <button className="reveal-button" onClick={() => setIsRevealed(true)}>
          Warning! NSFW Content! Click to Proceed 🔞
        </button>
      )}
    </div>
  </>
)}






      {(results.length > 0 || loading) && (
        <>
          <h3 className="subtitle">
  Results{" "}
  {activeSearchTerm
    ? `for "${activeSearchTerm}"`
    : selectedGenre || selectedYear || sort
    ? "based on filters"
    : ""}
</h3>


          {loading && <p>Loading...</p>}

          {!loading && results.length === 0 && <p>No manga found.</p>}

          <div className="results-grid">
            {results.map((manga) => (
              <Link
                to={`/manga/${manga.mal_id}`}
                key={manga.mal_id} 
                className="result-card"
              >
                <img
                  src={manga.images.jpg.image_url}
                  alt={manga.title}
                  className="result-image"
                />
                <p className="result-title">{manga.title}</p>
                {manga.score && <p className="manga-score">MAL Score: {manga.score}</p>}
              </Link>
            ))}
          </div>

          {hasMore && !loading && (
            <button className="show-more-button" onClick={handleShowMore}>
              Show More
            </button>
          )}
        </>
      )}

      {!loading && results.length === 0 && !searchTerm && !selectedGenre && !selectedYear && !sort && (
        <p>Use the search bar or filters above to find manga.</p>
      )}
    </div>
  );
}

export default Search;
