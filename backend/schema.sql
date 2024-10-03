CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  conversations JSONB,
  search_history JSONB,
  selected_index TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT,
  link TEXT,
  image_data TEXT
);
