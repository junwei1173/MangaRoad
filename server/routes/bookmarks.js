const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const router = express.Router();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Token is not valid" });
  }
};

// Add bookmark
router.post("/add", auth, async (req, res) => {
  const { mangaId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user.bookmarks.includes(mangaId)) {
      user.bookmarks.push(mangaId);
      await user.save();
    }
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove bookmark
router.post("/remove", auth, async (req, res) => {
  const { mangaId } = req.body;
  if (!mangaId) return res.status(400).json({ msg: "No mangaId provided" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Convert both to strings for comparison
    user.bookmarks = user.bookmarks.filter((id) => String(id) !== String(mangaId));
    await user.save();

    res.json({ msg: "Bookmark removed", bookmarks: user.bookmarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add rating
router.post("/rate", auth, async (req, res) => {
  const { mangaId, score, review } = req.body;

  if (!mangaId || !score) {
    return res.status(400).json({ msg: "Manga ID and score are required" });
  }

  try {
    const user = await User.findById(req.user.id);

    // Check if user already rated this manga
    const existingRating = user.ratings.find(r => r.mangaId === mangaId);

    if (existingRating) {
      existingRating.score = score;
      existingRating.review = review || "";
    } else {
      user.ratings.push({ mangaId, score, review: review || "" });
    }

    await user.save();
    res.json({ msg: "Rating saved", ratings: user.ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


router.delete("/rating/:mangaId", auth, async (req, res) => {
  const { mangaId } = req.params;
  
  if (!mangaId) {
    return res.status(400).json({ msg: "Manga ID is required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Find the rating to remove
    const ratingIndex = user.ratings.findIndex(r => String(r.mangaId) === String(mangaId));
    
    if (ratingIndex === -1) {
      return res.status(404).json({ msg: "Rating not found" });
    }

    // Remove the rating
    user.ratings.splice(ratingIndex, 1);
    await user.save();

    res.json({ 
      msg: "Rating and review removed successfully", 
      ratings: user.ratings 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/average/:mangaId", async (req, res) => {
  const { mangaId } = req.params;

  try {
    // Get all users who have rated this manga
    const users = await User.find({ "ratings.mangaId": mangaId });

    let total = 0;
    let count = 0;

    users.forEach(user => {
      const rating = user.ratings.find(r => r.mangaId === mangaId);
      if (rating) {
        total += rating.score;
        count += 1;
      }
    });

    const average = count > 0 ? (total / count).toFixed(2) : null;
    res.json({ average, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add or update a review
router.post("/review", auth, async (req, res) => {
  const { mangaId, score, review } = req.body;
  if (!mangaId || !score) return res.status(400).json({ msg: "Manga ID and score are required" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const existingRating = user.ratings.find(r => r.mangaId === mangaId);
    if (existingRating) {
      existingRating.score = score;
      existingRating.review = review;
    } else {
      user.ratings.push({ mangaId, score, review });
    }

    await user.save();
    res.json({ msg: "Review saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all reviews for a manga
router.get("/reviews/:id", async (req, res) => {
  const mangaId = req.params.id;

  try {
    const users = await User.find({ "ratings.mangaId": mangaId });

    const reviews = [];
    users.forEach(user => {
      user.ratings.forEach(rating => {
        if (rating.mangaId === mangaId && rating.review) {
          reviews.push({
            username: user.username,
            score: rating.score,
            review: rating.review
          });
        }
      });
    });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/recommendations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get user's bookmarks and high ratings
    const highRatedManga = user.ratings.filter(r => r.score >= 4).map(r => r.mangaId);
    const allMangaIds = [...new Set([...user.bookmarks, ...highRatedManga])];

    // If user has no preferences, return popular manga
    if (allMangaIds.length === 0) {
      console.log("No user preferences found, returning popular manga");
      try {
        const popularResponse = await jikanRequest('https://api.jikan.moe/v4/top/manga?limit=8');
        return res.json({
          recommendations: popularResponse.data.data.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            image: manga.images.jpg.image_url,
            genres: manga.genres ? manga.genres.map(g => g.name) : [],
            score: manga.score
          })),
          reason: "Popular manga (no user preferences found)"
        });
      } catch (err) {
        console.error("Failed to fetch popular manga:", err);
        return res.status(500).json({ msg: "Failed to fetch recommendations" });
      }
    }

    // Analyze only the FIRST manga to avoid rate limits
    const firstMangaId = allMangaIds[0];
    console.log(`Analyzing only manga ID: ${firstMangaId}`);

    // Variables for genre id and name
    let topGenreId = null;
    let topGenreName = null;

    try {
      const response = await jikanRequest(`https://api.jikan.moe/v4/manga/${firstMangaId}`);
      const genres = response.data.data.genres || [];

      if (genres.length > 0) {
        topGenreId = genres[0].mal_id;  // genre ID (number)
        topGenreName = genres[0].name;  // genre name (string)
        console.log(`Using genre: ${topGenreName} (ID: ${topGenreId})`);
      }
    } catch (err) {
      console.error(`Failed to fetch manga ${firstMangaId}:`, err.message);
    }

    // If no genre found, fallback to popular manga
    if (!topGenreId) {
      console.log("No genre found, falling back to popular manga");
      try {
        const popularResponse = await jikanRequest('https://api.jikan.moe/v4/top/manga?limit=8');
        return res.json({
          recommendations: popularResponse.data.data.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            image: manga.images.jpg.image_url,
            genres: manga.genres ? manga.genres.map(g => g.name) : [],
            score: manga.score
          })),
          reason: "Popular manga (couldn't analyze preferences)"
        });
      } catch (err) {
        console.error("Failed to fetch popular manga fallback:", err);
        return res.status(500).json({ msg: "Failed to fetch recommendations" });
      }
    }

    // Search for manga in the found genre using genre ID
    console.log(`Searching for manga in genre ID: ${topGenreId}`);
    try {
      const genreResponse = await jikanRequest(`https://api.jikan.moe/v4/manga?genres=${topGenreId}&order_by=score&sort=desc&limit=12`);

      // Filter out already bookmarked or rated manga
      const userMangaIds = new Set([
        ...user.bookmarks.map(id => String(id)),
        ...user.ratings.map(r => String(r.mangaId))
      ]);

      const recommendations = genreResponse.data.data
        .filter(manga => !userMangaIds.has(String(manga.mal_id)))
        .slice(0, 8)
        .map(manga => ({
          id: manga.mal_id,
          title: manga.title,
          image: manga.images.jpg.image_url,
          genres: manga.genres ? manga.genres.map(g => g.name) : [],
          score: manga.score
        }));

      console.log(`Found ${recommendations.length} recommendations`);

      res.json({
        recommendations,
        reason: `Based on your interest in ${topGenreName} manga`
      });

    } catch (err) {
      console.error('Genre search error:', err);
     
      try {
        const popularResponse = await jikanRequest('https://api.jikan.moe/v4/top/manga?limit=8');
        return res.json({
          recommendations: popularResponse.data.data.map(manga => ({
            id: manga.mal_id,
            title: manga.title,
            image: manga.images.jpg.image_url,
            genres: manga.genres ? manga.genres.map(g => g.name) : [],
            score: manga.score
          })),
          reason: "Popular manga (search failed)"
        });
      } catch (finalErr) {
        console.error("All fallbacks failed:", finalErr);
        return res.status(500).json({ msg: "Failed to fetch recommendations" });
      }
    }

  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ msg: "Failed to get recommendations" });
  }
});



const jikanRequest = async (url, retries = 1) => {
  for (let i = 0; i < retries; i++) {
    try {
     
      await delay(500);
      
      console.log(`Making request to: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000, 
        headers: {
          'User-Agent': 'MangaApp/1.0'
        }
      });
      
      console.log(`Request successful`);
      return response;
    } catch (error) {
      console.error(`Request failed:`, error.message);
      
      if (error.response?.status === 429) {
        // Rate limited - wait much longer
        const waitTime = 5000 * (i + 1); // 5s, 10s
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await delay(waitTime);
        continue;
      }
      
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

router.get("/suggestions", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const genreCounts = {};

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    
    async function fetchMangaGenres(mangaId, retries = 3) {
      try {
        const response = await axios.get(`https://api.jikan.moe/v4/manga/${mangaId}`);
        return response.data.data.genres.map((g) => g.name);
      } catch (err) {
        if (err.response?.status === 429 && retries > 0) {
          const waitTime = 2000 * (4 - retries); // 2s, 4s, 6s...
          console.warn(`Rate limited. Waiting ${waitTime}ms before retrying manga ${mangaId}`);
          await delay(waitTime);
          return fetchMangaGenres(mangaId, retries - 1);
        } else {
          console.warn(`Failed to fetch manga ${mangaId}:`, err.message);
          return [];
        }
      }
    }

    
    for (const entry of user.ratings) {
      if (entry.score >= 4) {
        const genres = await fetchMangaGenres(entry.mangaId);
        for (const genre of genres) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
        await delay(2000); 
      }
    }

    
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([genre]) => genre);

    if (favoriteGenres.length === 0) return res.json([]);

    
    const searchPromises = favoriteGenres.map((genre) =>
      axios.get(`https://api.jikan.moe/v4/manga?genres=${encodeURIComponent(genre)}&limit=10`)
    );

    const searchResults = await Promise.allSettled(searchPromises);

    const allSuggestions = searchResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value.data.data : []
    );

    
    const ratedOrBookmarked = new Set([
      ...user.bookmarks.map((id) => String(id)),
      ...user.ratings.map((r) => String(r.mangaId)),
    ]);

    const uniqueSuggestions = allSuggestions.filter(
      (manga, index, self) =>
        !ratedOrBookmarked.has(String(manga.mal_id)) &&
        index === self.findIndex((m) => m.mal_id === manga.mal_id)
    );

    res.json(uniqueSuggestions.slice(0, 8));
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ msg: "Failed to fetch suggestions" });
  }
});


module.exports = router;