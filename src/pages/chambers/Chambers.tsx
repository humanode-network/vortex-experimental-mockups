import "./chambers.css";
import { Link } from "react-router";

const Chambers: React.FC = () => {
  return (
    <div className="app-page chambers-page">
      <h1>Chambers</h1>
      <p className="chamber-meta">Browse active governance chambers.</p>

      <section className="chambers-grid">
        <article className="chamber-card">
          <h3>Protocol Engineering</h3>
          <p className="chamber-meta">Core protocol, network stability, clients.</p>
          <p className="chamber-summary">
            Oversees upgrades to validator stack, biometric verification flow, and consensus tuning.
          </p>
          <div className="chamber-footer">
            <span className="chamber-meta">Lead: Mozgiii</span>
            <Link className="btn btn--small btn--primary chamber-link" to="/chambers/protocol-engineering">
              Open chamber
            </Link>
          </div>
        </article>

        <article className="chamber-card">
          <h3>Economics & Treasury</h3>
          <p className="chamber-meta">Token economics, fees, program budgets.</p>
          <p className="chamber-summary">
            Shapes fee policy, treasury distributions, and incentive design across programs.
          </p>
          <div className="chamber-footer">
            <span className="chamber-meta">Lead: Raamara</span>
            <Link className="btn btn--small btn--primary chamber-link" to="/chambers/economics">
              Open chamber
            </Link>
          </div>
        </article>

        <article className="chamber-card">
          <h3>Security & Infra</h3>
          <p className="chamber-meta">Audits, monitoring, deterrence.</p>
          <p className="chamber-summary">
            Handles preventative controls, incident drills, and operational security posture.
          </p>
          <div className="chamber-footer">
            <span className="chamber-meta">Lead: TBD</span>
            <Link className="btn btn--small btn--primary chamber-link" to="/chambers/security">
              Open chamber
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Chambers;
