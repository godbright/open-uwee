# Supabase Authentication Setup Guide

## 🔧 Fixing the 400 Authentication Error

The 400 error you're seeing typically occurs due to Supabase project configuration issues. Follow these steps to resolve it:

### 1. **Create the Users Table in Supabase**

Go to your Supabase dashboard at https://jbntqqwkblaukyrqnqxl.supabase.co and run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  provider VARCHAR(50) DEFAULT 'email',
  provider_id VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for inserting user profiles (during signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON users;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

### 2. **Enable Email Authentication**

In your Supabase dashboard:
1. Go to **Authentication** > **Settings**
2. Make sure **Enable email confirmations** is **DISABLED** for testing (you can enable it later)
3. Ensure **Enable email signups** is **ENABLED**

### 3. **Configure OAuth Providers (Optional)**

For Google OAuth:
1. Go to **Authentication** > **Providers**
2. Click on **Google**
3. Enable the provider and add your OAuth credentials

For GitHub OAuth:
1. Go to **Authentication** > **Providers** 
2. Click on **GitHub**
3. Enable the provider and add your OAuth credentials

### 4. **Update Site URL**

In **Authentication** > **Settings**:
- Set **Site URL** to: `http://localhost:3000` (for development)
- Add **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000`

### 5. **Test the Setup**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Try to sign up with a test email

4. Check the browser console for any detailed error messages

## 🚨 Common Issues & Solutions

### Issue: "Invalid login credentials"
- **Solution**: Make sure you're using a valid email format and password is at least 6 characters

### Issue: "Email rate limit exceeded"
- **Solution**: Wait a few minutes or use a different email

### Issue: "User already registered"
- **Solution**: Try signing in instead of signing up, or use a different email

### Issue: "Table 'users' doesn't exist"
- **Solution**: Run the SQL from step 1 above

### Issue: "Row Level Security policy violation"
- **Solution**: Make sure the RLS policies from step 1 are created

## 🔍 Debug Mode

Add this component to your page to test the connection:

```tsx
import SupabaseTest from "@/components/auth/SupabaseTest";

// Add this to any page for debugging
<SupabaseTest />
```

This will help you identify exactly what's failing in the authentication process.

## 📝 Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jbntqqwkblaukyrqnqxl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibnRxcXdrYmxhdWt5cnFucXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjEzNjgsImV4cCI6MjA3MzkzNzM2OH0.A46ewze-YOuG4L12FMPe26dQvPlxLGe6_PV2MWDLXrA
```

## ✅ After Setup

Once you've completed these steps:
1. The 400 error should be resolved
2. Email signup/login should work
3. OAuth providers should work (if configured)
4. User data should be properly stored in the database

If you're still getting errors, check the browser console and network tab for more detailed error messages.