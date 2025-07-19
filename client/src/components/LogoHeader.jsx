import React from "react";
import logo from "../assets/mgrlogo.png"; 

function LogoHeader() {
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <img
        src={logo}
        alt="Logo"
        style={{ height: "210px" }} 
      />
    </div>
  );
}

export default LogoHeader;
