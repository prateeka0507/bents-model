PostgreSQL Schema

-- Users table (existing, with modifications)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  conversations JSONB,
  search_history JSONB,
  selected_index TEXT
);

-- Contacts table (new, based on Mongoose schema)
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table (existing)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT,
  link TEXT,
  image_data TEXT
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

-- Add constraints
ALTER TABLE contacts
ADD CONSTRAINT check_email_format
CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

ALTER TABLE contacts
ADD CONSTRAINT check_name_not_empty
CHECK (length(trim(name)) > 0);

ALTER TABLE contacts
ADD CONSTRAINT check_subject_not_empty
CHECK (length(trim(subject)) > 0);

ALTER TABLE contacts
ADD CONSTRAINT check_message_not_empty
CHECK (length(trim(message)) > 0);
