import "./AppSidebar.css";

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        <a className="sidebar__link" data-nav-link="human-nodes" href="/page1">
          Page 1 (route demo)
        </a>
        <a
          className="sidebar__link"
          data-nav-link="human-nodes"
          href="/human-nodes"
        >
          Human nodes
        </a>
        <a
          className="sidebar__link"
          data-nav-link="proposals"
          href="/proposals"
        >
          Proposals
        </a>
        <a
          className="sidebar__link sidebar__link--active"
          data-nav-link="chambers"
          aria-current="page"
          href="/chambers"
        >
          Chambers
        </a>
        <a
          className="sidebar__link"
          data-nav-link="formation"
          href="/formation"
        >
          Formation
        </a>
        <a className="sidebar__link" data-nav-link="invision" href="/invision">
          Invision
        </a>
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
