import { NavLink } from "react-router";
import "./AppSidebar.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        <NavLink className={navClass} to="/profile">
          Profile
        </NavLink>
        <NavLink className={navClass} to="/factions">
          Factions
        </NavLink>
        <NavLink className={navClass} to="/human-nodes">
          Human nodes
        </NavLink>
        <NavLink className={navClass} to="/proposals">
          Proposals
        </NavLink>
        <NavLink className={navClass} to="/chambers">
          Chambers
        </NavLink>
        <NavLink className={navClass} to="/formation">
          Formation
        </NavLink>
        <NavLink className={navClass} to="/invision">
          Invision
        </NavLink>
        <NavLink className={navClass} to="/settings">
          Settings
        </NavLink>
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
