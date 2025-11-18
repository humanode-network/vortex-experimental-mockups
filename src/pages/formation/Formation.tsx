import "./formation.css";
import { Link } from "react-router";

const Formation: React.FC = () => {
  return (
    <div className="app-page formation-page">
      <h1>Formation</h1>

      <section className="formation-metrics">
        <article>
          <p>Total funded HMND</p>
          <strong>210k</strong>
        </article>
        <article>
          <p>Active projects</p>
          <strong>12</strong>
        </article>
        <article>
          <p>Open team slots</p>
          <strong>9</strong>
        </article>
        <article>
          <p>Milestones delivered</p>
          <strong>46</strong>
        </article>
      </section>

      <section className="formation-controls">
        <div className="chip-group" role="tablist">
          <button className="chip chip--active" type="button">
            All
          </button>
          <button className="chip" type="button">
            Research
          </button>
          <button className="chip" type="button">
            Development
          </button>
          <button className="chip" type="button">
            Social
          </button>
        </div>
        <div className="chip-group">
          <span className="chip">Live</span>
          <span className="chip">Upcoming</span>
          <span className="chip">Completed</span>
        </div>
      </section>

      <section className="formation-search" role="search">
        <label className="eyebrow" htmlFor="formation-search">
          Search projects
        </label>
        <div className="formation-search__field">
          <input
            id="formation-search"
            type="search"
            placeholder="Search by project, proposer, focus…"
          />
          <button type="button" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </section>

      <section className="formation-grid">
        <article className="formation-card">
          <div>
            <h3 className="formation-card__title">Node Health Kit</h3>
            <p className="formation-card__meta">Formation Logistics · Live</p>
            <p className="formation-card__summary">
              Tooling bundle to automate node diagnostics and recovery workflows
              for operators.
            </p>
          </div>
          <ul className="formation-card__stats">
            <li>Budget: 80k HMND</li>
            <li>Milestones: 6 / 9</li>
            <li>Team slots: 2 open</li>
          </ul>
          <div className="formation-card__footer">
            <p className="formation-card__proposer">
              Proposer: <Link to="/human-nodes/Mozgiii">Mozgiii</Link>
            </p>
            <Link
              className="btn btn--small btn--primary"
              to="/formation/node-health-kit"
            >
              Open project
            </Link>
          </div>
        </article>

        <article className="formation-card">
          <div>
            <h3 className="formation-card__title">Identity Risk Lab</h3>
            <p className="formation-card__meta">Research · Upcoming</p>
            <p className="formation-card__summary">
              Experimental track exploring threat modeling for biometric
              verification attacks.
            </p>
          </div>
          <ul className="formation-card__stats">
            <li>Budget: 45k HMND</li>
            <li>Milestones: 0 / 5</li>
            <li>Team slots: 3 open</li>
          </ul>
          <div className="formation-card__footer">
            <p className="formation-card__proposer">
              Proposer: <Link to="/human-nodes/Raamara">Raamara</Link>
            </p>
            <Link
              className="btn btn--small btn--primary"
              to="/formation/identity-risk-lab"
            >
              Open project
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Formation;
