import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogoHeader from "./components/LogoHeader";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import MangaDetail from "./pages/MangaDetail";
import Profile from "./pages/Profile";
import SpotifyPlayer from "./components/SpotifyPlayer";
import Users from "./pages/Users";
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <Router>
      <LogoHeader />
      <div style={{
    textAlign: "center",
    marginTop: "20px",
    paddingBottom: "0.01px",
  }}
>
        
      </div>
      <Navbar />
      <div style={{ paddingBottom: "100px" }}> {/* leave space for spotify */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<Users />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        
        <Route path="/manga/:id" element={<MangaDetail />} />
      </Routes>
      <SpotifyPlayer playlistId="37i9dQZF1DX8Kgdykz6OKj" />
      </div>
    </Router>
  );
}

export default App;
