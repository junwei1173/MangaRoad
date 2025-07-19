import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css"; 

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar-manga">
      <div className="navbar-links">
        <Link to="/">🏠 Home</Link>
        <Link to="/search">🔍 Search</Link>
        <Link to="/profile">👤 Profile</Link>
        <Link to="/users">👥 Users</Link>

        {!token ? (
          <>
            <Link to="/login">🔓 Login</Link>
            <Link to="/register">📝 Register</Link>
          </>
        ) : (
          <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
