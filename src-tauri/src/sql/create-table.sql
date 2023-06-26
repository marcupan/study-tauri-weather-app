CREATE TABLE IF NOT EXISTS Cities (
      id         INTEGER     PRIMARY KEY AUTOINCREMENT,
      name       TEXT           NOT NULL,
      lat        REAL,
      lon        REAL
);