import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Users.css";


function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Fetch all users + current user's following list
  useEffect(() => {
    const fetchUsersAndFollowing = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch both users and current user data in parallel
        const [usersRes, userRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/auth/all-users`, {
            headers: { "x-auth-token": token },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
            headers: { "x-auth-token": token },
          })
        ]);

        // Filter out users with missing usernames and current user
        const validUsers = usersRes.data.users.filter(user => 
          user.username && 
          user.username.trim() !== "" &&
          user._id !== userRes.data.id
        );

        console.log("All users from API:", usersRes.data.users);
        console.log("Valid users after filtering:", validUsers);
        console.log("Current user ID:", userRes.data.id);

        setUsers(validUsers);
        setFilteredUsers([]); 
        setFollowed(userRes.data.following || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndFollowing();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowAll(false); 
  };

  const handleShowAll = () => {
    setShowAll(true);
    setSearchTerm(""); 
    setFilteredUsers(users);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setShowAll(false);
    setFilteredUsers([]);
  };

  const handleFollow = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in");
      return;
    }

    
    setFollowed((prev) => [...prev, userId]);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/follow/${userId}`, null, {
        headers: { "x-auth-token": token },
      });
      
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
        headers: { "x-auth-token": token },
      });
      setFollowed(userRes.data.following || []);
      
    } catch (err) {
      
      setFollowed((prev) => prev.filter(id => id !== userId));
      
      if (err.response) {
        if (err.response.status === 400) {
          alert(err.response.data.msg || "Can't follow yourself");
        } else {
          alert(`Follow failed: ${err.response.data.msg || "Unknown error"}`);
        }
      } else {
        alert("Network error, please try again");
      }
      console.error("Follow failed", err);
    }
  };

  const handleUnfollow = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in");
      return;
    }

    
    setFollowed((prev) => prev.filter(id => id !== userId));

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/unfollow/${userId}`, null, {
        headers: { "x-auth-token": token },
      });
      
     
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
        headers: { "x-auth-token": token },
      });
      setFollowed(userRes.data.following || []);
      
    } catch (err) {
      
      setFollowed((prev) => [...prev, userId]);
      alert("Unfollow failed, please try again");
      console.error("Unfollow failed", err);
    }
  };

  const displayUsers = showAll ? users : filteredUsers;

  if (loading) {
    return <div><h2>Find Users</h2><p>Loading...</p></div>;
  }

  return (
    <div className="users-container">
    <h2 className="users-title">Find Users</h2>

    {/* Search Bar */}
    <div className="search-bar">
      <input
        className="search-input"
        type="text"
        placeholder="Search users by username..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {searchTerm && (
        <button className="button clear-button" onClick={handleClearSearch}>
          Clear
        </button>
      )}
      <button className="button" onClick={handleShowAll}>
        Show All Users ({users.length})
      </button>
    </div>

    {/* Search results info */}
    {!showAll && searchTerm && (
      <p style={{ color: "#666", marginBottom: "15px" }}>
        {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found for "{searchTerm}"
      </p>
    )}

    {/* Users list or empty message */}
    {displayUsers.length === 0 ? (
      <p>
        {searchTerm
          ? `No users found matching "${searchTerm}".`
          : showAll
          ? "No users found."
          : "Search for users or click 'Show All Users' to browse."}
      </p>
    ) : (
      <div className="users-grid">
        {displayUsers.map((user) => (
          <div key={user._id} className="user-card">
            <div>
              <Link to={`/profile/${user._id}`} className="user-name">
                {user.username || "[No Username]"}
              </Link>
              <div className="user-stats">
                <span>Followers: {user.followers?.length || 0}</span> |{" "}
                <span>Following: {user.following?.length || 0}</span> |{" "}
                <span>Bookmarks: {user.bookmarks?.length || 0}</span>
              </div>
            </div>
            <div>
              {followed.includes(user._id) ? (
                <button
                  className="follow-button unfollow"
                  onClick={() => handleUnfollow(user._id)}
                >
                  Unfollow
                </button>
              ) : (
                <button
                  className="follow-button follow"
                  onClick={() => handleFollow(user._id)}
                >
                  Follow
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}

export default Users;