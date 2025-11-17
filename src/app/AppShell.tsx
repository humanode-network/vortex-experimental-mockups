import Sidebar from "./Sidebar";

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="app-shell">
        <Sidebar />

        <main id="main" className="workspace">
          {children}
        </main>
      </div>
    </>
  );
};

export default AppShell;
