import React, { useState } from "react";

const SpotifyPlayer = ({ playlistId }) => {
  const [isVisible, setIsVisible] = useState(true);

  const togglePlayer = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Player Box */}
      <div
        style={{
          position: "fixed",
          bottom: isVisible ? "20px" : "-110px", 
          right: "20px",
          width: "350px",
          backgroundColor: "black",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          transition: "bottom 0.4s ease",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            padding: "6px 10px",
            backgroundColor: "#d4cbb7ff",
          }}
        >
          <button
            onClick={togglePlayer}
            style={{
              fontSize: "12px",
              backgroundColor: "#ff5722",
              border: "none",
              color: "white",
              padding: "4px 8px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Hide
          </button>
        </div>
        <iframe
          title="Spotify Player"
          src={`https://open.spotify.com/embed/playlist/${playlistId}`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowTransparency="true"
          style={{ borderRadius: "0 0 12px 12px", border: "none" }}
        ></iframe>
      </div>

      {/* Show Button – only visible When hidden */}
      {!isVisible && (
        <button
          onClick={togglePlayer}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#2196f3",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            cursor: "pointer",
            zIndex: 10000,
          }}
        >
          Show
        </button>
      )}
    </>
  );
};

export default SpotifyPlayer;
