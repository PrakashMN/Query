import { Link } from "react-router-dom";
import myManeLogo from "../../../shared/assets/mymane-logo.svg";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <img src={myManeLogo} alt="MyMane" className="brand-logo" />
        <div>
          <strong>MyMane Admin</strong>
          <small>Your Home Journey</small>
        </div>
      </Link>
      <div className="nav-actions">
        <span>Open Access</span>
      </div>
    </header>
  );
}

export default Navbar;
