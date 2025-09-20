"use client";

import { useState } from "react";
import { Button, Card, message } from "antd";
import { supabase } from "@/lib/supabase";

export default function SupabaseTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
      
      if (error) {
        console.error('Connection test error:', error);
        setResult({ error: error.message });
        message.error(`Connection failed: ${error.message}`);
      } else {
        console.log('Connection test success:', data);
        setResult({ success: true, count: data });
        message.success('Supabase connection successful!');
      }
    } catch (err) {
      console.error('Connection test exception:', err);
      setResult({ error: String(err) });
      message.error('Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const testSignUp = async () => {
    setLoading(true);
    try {
      const testEmail = `test+${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
      });
      
      if (error) {
        console.error('Test signup error:', error);
        setResult({ signupError: error.message });
        message.error(`Signup failed: ${error.message}`);
      } else {
        console.log('Test signup success:', data);
        setResult({ signupSuccess: true, user: data.user });
        message.success('Test signup successful!');
      }
    } catch (err) {
      console.error('Test signup exception:', err);
      setResult({ signupError: String(err) });
      message.error('Test signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Supabase Connection Test" className="m-4 max-w-md">
      <div className="space-y-4">
        <Button 
          onClick={testConnection} 
          loading={loading}
          type="primary"
          block
        >
          Test Database Connection
        </Button>
        
        <Button 
          onClick={testSignUp} 
          loading={loading}
          block
        >
          Test Auth Signup
        </Button>
        
        {result && (
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
        </div>
      </div>
    </Card>
  );
}