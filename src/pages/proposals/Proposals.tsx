import "./proposals.css";

const Proposals: React.FC = () => {
  return (
    <div className="app-page proposals-page">
      <section className="filter-drawer">
        <div className="filter-drawer__header">
          <div>
            <p className="eyebrow">Filters</p>
            <strong>Search proposals</strong>
          </div>
        </div>
        <div className="filter-grid">
          <label>
            Keyword search
            <input type="search" placeholder="Proposal, hash, proposer…" />
          </label>
          <label>
            Status
            <select>
              <option>Any</option>
              <option>Proposal pool</option>
              <option>Chamber vote</option>
              <option>Formation build</option>
              <option>Final vote</option>
              <option>Archived</option>
            </select>
          </label>
          <label>
            Chamber
            <select>
              <option>All chambers</option>
              <option>Protocol Engineering</option>
              <option>Economics</option>
              <option>Security</option>
              <option>Social</option>
            </select>
          </label>
          <label>
            Sort by
            <select>
              <option>Newest</option>
              <option>Oldest</option>
              <option>Activity</option>
            </select>
          </label>
        </div>
      </section>

      <section className="proposal-stack">
        <article className="proposal-item">
          <div className="proposal-head">
            <div>
              <p className="proposal-meta">Protocol Engineering · Legate tier</p>
              <h3 className="proposal-title">Orbital Mesh Sequencer Upgrade</h3>
            </div>
            <div className="proposal-tags">
              <span className="stage-chip">Proposal pool</span>
              <span className="stage-chip">Protocol chamber</span>
            </div>
          </div>
          <p className="proposal-summary">
            Introduce redundant biometric sequencer nodes to lower latency inside human-node verification flow and
            enable inter-era checkpoints.
          </p>
          <div className="card-actions">
            <button className="btn btn--small btn--primary" type="button">
              Open proposal
            </button>
            <button className="btn btn--small btn--ghost" type="button">
              Watch
            </button>
          </div>
        </article>

        <article className="proposal-item">
          <div className="proposal-head">
            <div>
              <p className="proposal-meta">Economics &amp; Treasury · Consul</p>
              <h3 className="proposal-title">Adaptive Fee Shaping</h3>
            </div>
            <div className="proposal-tags">
              <span className="stage-chip">Chamber vote</span>
              <span className="stage-chip">Economics chamber</span>
            </div>
          </div>
          <p className="proposal-summary">
            Tune transaction fees dynamically based on network load to improve determinism for quorum settlement while
            protecting user experience.
          </p>
          <div className="card-actions">
            <button className="btn btn--small btn--primary" type="button">
              Open proposal
            </button>
            <button className="btn btn--small btn--ghost" type="button">
              Watch
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Proposals;
