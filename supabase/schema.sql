-- ==============================================================================
-- INSIGHTLY - Real-time Website Analytics Platform
-- Supabase PostgreSQL Schema
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WEBSITES TABLE
CREATE TABLE IF NOT EXISTS websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    tracking_key_hash VARCHAR(128) NOT NULL,
    dashboard_key_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_websites_site_id ON websites(site_id);
CREATE INDEX IF NOT EXISTS idx_websites_dashboard_hash ON websites(dashboard_key_hash);
CREATE INDEX IF NOT EXISTS idx_websites_tracking_hash ON websites(tracking_key_hash);

-- 2. VISITORS TABLE
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    anonymous_id VARCHAR(128) NOT NULL,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    country VARCHAR(64) DEFAULT 'Unknown',
    region VARCHAR(64) DEFAULT 'Unknown',
    device_type VARCHAR(32) DEFAULT 'desktop',
    browser VARCHAR(64) DEFAULT 'Unknown',
    os VARCHAR(64) DEFAULT 'Unknown',
    CONSTRAINT unique_visitor_per_site UNIQUE (site_id, anonymous_id)
);

CREATE INDEX IF NOT EXISTS idx_visitors_site_id ON visitors(site_id);
CREATE INDEX IF NOT EXISTS idx_visitors_anon_id ON visitors(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON visitors(country);
CREATE INDEX IF NOT EXISTS idx_visitors_device ON visitors(device_type);

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    session_id VARCHAR(128) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    landing_page TEXT NOT NULL,
    exit_page TEXT,
    duration INTEGER DEFAULT 0, -- in seconds
    is_bounce BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_session_per_site UNIQUE (site_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_site_id ON sessions(site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- 4. PAGEVIEWS TABLE
CREATE TABLE IF NOT EXISTS pageviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    session_id VARCHAR(128) NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    title TEXT,
    referrer TEXT,
    referrer_domain VARCHAR(255),
    utm_source VARCHAR(128),
    utm_medium VARCHAR(128),
    utm_campaign VARCHAR(128),
    utm_term VARCHAR(128),
    utm_content VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pageviews_site_id ON pageviews(site_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_url ON pageviews(url);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path);
CREATE INDEX IF NOT EXISTS idx_pageviews_referrer ON pageviews(referrer_domain);
CREATE INDEX IF NOT EXISTS idx_pageviews_utm_source ON pageviews(utm_source);

-- 5. EVENTS TABLE (Custom Events)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    session_id VARCHAR(128),
    event_type VARCHAR(128) NOT NULL,
    page_url TEXT,
    referrer TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- 6. DAILY_STATS TABLE (Pre-aggregated rollups)
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    visitors INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    pageviews INTEGER DEFAULT 0,
    bounce_rate NUMERIC(5,2) DEFAULT 0.00,
    avg_session_duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_stat UNIQUE (site_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_site_date ON daily_stats(site_id, date);

-- 7. MILESTONES TABLE (Celebrations & Shareables)
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id VARCHAR(64) NOT NULL REFERENCES websites(site_id) ON DELETE CASCADE,
    milestone_type VARCHAR(64) NOT NULL, -- 'visitors_100', 'visitors_1000', etc.
    threshold INTEGER NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_site_milestone UNIQUE (site_id, milestone_type)
);

CREATE INDEX IF NOT EXISTS idx_milestones_site_id ON milestones(site_id);

-- ROW LEVEL SECURITY (RLS)
-- Deny all public direct client access. All queries pass securely through the server-side API.
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Enable service role full access for backend server execution
CREATE POLICY "Service role full access on websites" ON websites FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on visitors" ON visitors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on pageviews" ON pageviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on daily_stats" ON daily_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on milestones" ON milestones FOR ALL USING (auth.role() = 'service_role');
