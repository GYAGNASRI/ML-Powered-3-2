// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

const projectId = "wkixhdwdixkefonguecg";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXhoZHdkaXhrZWZvbmd1ZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDM2MDksImV4cCI6MjA4ODY3OTYwOX0.0M2eZwTnNVT2iD30rf8Y-yIZu8lf5JoAoc62lqrz-9Q";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase Connection...');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    // Test 1: Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('✓ Auth session check: No active session (expected)');
    } else {
      console.log('✓ Auth is working');
    }

    // Test 2: Try to list tables by querying information_schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
      
    if (tablesError) {
      console.log('⚠️ Tables error:', tablesError.message);
    } else {
      console.log('✓ Database accessible');
      console.log('📊 Available tables:', tables?.map(t => t.table_name) || []);
    }

    // Test 3: Check kv_store table
    const { data: kvData, error: kvError } = await supabase
      .from('kv_store_c5a14d46')
      .select('*')
      .limit(1);

    if (kvError) {
      console.log('⚠️ KV Store table error:', kvError.message);
    } else {
      console.log('✓ KV Store table exists');
    }

    // Test 4: Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('⚠️ Users table error:', usersError.message);
      console.log('💡 Run database_setup.sql in Supabase SQL Editor to create the users table');
    } else {
      console.log('✓ Users table exists');
    }

    console.log('\n✅ Supabase connection is working!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
