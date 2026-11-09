-- Schema-only migration. Counters are created lazily by the same atomic INSERT.
CREATE TABLE progress_shares (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 22),
  token TEXT NOT NULL CHECK(length(token) BETWEEN 5 AND 12000),
  client_hash TEXT NOT NULL CHECK(length(client_hash) = 64),
  day INTEGER NOT NULL CHECK(day >= 0),
  created_at INTEGER NOT NULL CHECK(created_at >= 0)
);

CREATE TABLE share_usage (
  scope TEXT NOT NULL,
  day INTEGER NOT NULL,
  used INTEGER NOT NULL CHECK(used >= 0),
  PRIMARY KEY (scope, day)
);

CREATE TRIGGER progress_share_limits BEFORE INSERT ON progress_shares BEGIN
  SELECT CASE WHEN COALESCE((SELECT used FROM share_usage WHERE scope = 'all' AND day = -1), 0) >= 100000
    THEN RAISE(ABORT, 'SHARE_TOTAL_LIMIT') END;
  SELECT CASE WHEN COALESCE((SELECT used FROM share_usage WHERE scope = 'global' AND day = NEW.day), 0) >= 5000
    THEN RAISE(ABORT, 'SHARE_GLOBAL_LIMIT') END;
  SELECT CASE WHEN COALESCE((SELECT used FROM share_usage WHERE scope = NEW.client_hash AND day = NEW.day), 0) >= 500
    THEN RAISE(ABORT, 'SHARE_CLIENT_LIMIT') END;
END;

CREATE TRIGGER progress_share_count AFTER INSERT ON progress_shares BEGIN
  INSERT INTO share_usage (scope, day, used) VALUES ('all', -1, 1)
    ON CONFLICT (scope, day) DO UPDATE SET used = used + 1;
  INSERT INTO share_usage (scope, day, used) VALUES ('global', NEW.day, 1)
    ON CONFLICT (scope, day) DO UPDATE SET used = used + 1;
  INSERT INTO share_usage (scope, day, used) VALUES (NEW.client_hash, NEW.day, 1)
    ON CONFLICT (scope, day) DO UPDATE SET used = used + 1;
END;

CREATE TRIGGER progress_share_immutable_update BEFORE UPDATE ON progress_shares BEGIN
  SELECT RAISE(ABORT, 'SHARE_IMMUTABLE');
END;
