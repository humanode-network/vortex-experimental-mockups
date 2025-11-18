import "./human-nodes.css";

const HumanNodes: React.FC = () => {
  return (
    <div className="app-page">
      <section className="nodes-searcher">
        <div className="search-bar" role="search">
          <input
            type="search"
            placeholder="Search Human nodes by handle, address, chamber, or focus…"
            aria-label="Search Human nodes"
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

        <div className="nodes-searcher__layout">
          <div className="nodes-searcher__list">
            <div className="results-header">
              <div className="results-topline">
                <p className="eyebrow">Results</p>
                <button type="button" className="results-toggle">
                  Toggle list view
                </button>
              </div>
              <div className="results-actions">
                <label className="sort-control">
                  <span>Sort by</span>
                  <select aria-label="Sort results">
                    <option>ACM (desc)</option>
                    <option>ACM (asc)</option>
                    <option>Tier</option>
                    <option>Name</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="search-results" aria-live="polite">
              <article className="search-result">
                <div className="search-result__head">
                  <strong>Mozgiii</strong>
                  <span>Legate · Protocol Engineering</span>
                </div>
                <div className="search-result__meta">
                  <span>ACM: 182</span>
                  <span>C-score: 164</span>
                  <span>M-score: 92</span>
                </div>
                <ul className="search-result__tags">
                  <li>Protocol</li>
                  <li>Security</li>
                  <li>Research</li>
                </ul>
              </article>

              <article className="search-result">
                <div className="search-result__head">
                  <strong>Raamara</strong>
                  <span>Consul · Economics</span>
                </div>
                <div className="search-result__meta">
                  <span>ACM: 168</span>
                  <span>C-score: 150</span>
                  <span>M-score: 80</span>
                </div>
                <ul className="search-result__tags">
                  <li>Treasury</li>
                  <li>Formation</li>
                  <li>Community</li>
                </ul>
              </article>
            </div>
          </div>

          <aside className="nodes-searcher__filters">
            <div className="filters-card">
              <header className="search-panel__header">
                <div>
                  <p className="eyebrow">Filters</p>
                  <h3>Refine directory</h3>
                </div>
              </header>

              <div className="filter-row">
                <label className="input-field input-field--grow">
                  <span>Tier</span>
                  <select aria-label="Filter by tier">
                    <option>Any</option>
                    <option>Nominee</option>
                    <option>Ecclesiast</option>
                    <option>Legate</option>
                    <option>Consul</option>
                    <option>Citizen</option>
                  </select>
                </label>

                <label className="input-field input-field--grow">
                  <span>Chamber</span>
                  <select aria-label="Filter by chamber">
                    <option>All specializations</option>
                    <option>Protocol Engineering</option>
                    <option>Research</option>
                    <option>Finance</option>
                    <option>Social</option>
                    <option>Formation Logistics</option>
                  </select>
                </label>

                <label className="input-field">
                  <span>C-score ≥</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue="150"
                    aria-label="Minimum cognitocratic score"
                  />
                </label>

                <label className="input-field">
                  <span>M-score ≥</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue="80"
                    aria-label="Minimum meritocratic score"
                  />
                </label>
              </div>

              <div className="filter-chips">
                <button className="chip" type="button">
                  Protocol
                </button>
                <button className="chip" type="button">
                  Security
                </button>
                <button className="chip" type="button">
                  Economics
                </button>
                <button className="chip" type="button">
                  Social
                </button>
                <button className="chip" type="button">
                  Formation
                </button>
                <button className="chip" type="button">
                  Research
                </button>
                <button className="chip" type="button">
                  High quorum
                </button>
              </div>

              <div className="filters-actions">
                <button className="btn btn--ghost btn--small" type="button">
                  Reset
                </button>
                <button className="btn btn--primary btn--small" type="button">
                  Apply
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default HumanNodes;
