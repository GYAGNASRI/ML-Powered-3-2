// Quick test script to test signup functionality
import { createClient } from '@supabase/supabase-js';

const projectId = "wkixhdwdixkefonguecg";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXhoZHdkaXhrZWZvbmd1ZWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDM2MDksImV4cCI6MjA4ODY3OTYwOX0.0M2eZwTnNVT2iD30rf8Y-yIZu8lf5JoAoc62lqrz-9Q";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

async function testSignup() {
  try {
    console.log('🧪 Testing signup functionality...');

    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpass123';

    console.log(`📧 Attempting to create account: ${testEmail}`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Signup failed:', error.message);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('🔗 Confirmation required:', !data.user?.email_confirmed_at);

    if (data.user?.email_confirmed_at) {
      console.log('🎉 Account is ready to use immediately');
    } else {
      console.log('⚠️ Email confirmation required before login');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSignup();