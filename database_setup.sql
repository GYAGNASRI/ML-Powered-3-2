-- Database Setup Script for EduPredict AI
-- Run this in Supabase SQL Editor to set up the database

-- Create users table for storing user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create or ensure kv_store table exists (for student data)
CREATE TABLE IF NOT EXISTS kv_store_c5a14d46 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable RLS on kv_store (optional, for additional security)
ALTER TABLE kv_store_c5a14d46 ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access their own data
CREATE POLICY "Users can access their own kv data" ON kv_store_c5a14d46
  FOR ALL USING (
    key LIKE 'student_%' AND
    (SELECT auth.uid()::text) = substring(key, 9)
  );

-- Allow access to auth data for login fallback
CREATE POLICY "Allow auth data access" ON kv_store_c5a14d46
  FOR SELECT USING (key LIKE 'auth_%');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_c5a14d46(key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();