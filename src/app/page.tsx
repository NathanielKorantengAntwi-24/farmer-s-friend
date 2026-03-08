// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  auth, googleProvider, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail 
} from '@/lib/firebase';
import { 
  Box, Typography, TextField, Button, Paper, Stack, Container, 
  alpha, Avatar, IconButton, InputAdornment, Tab, Tabs, CircularProgress, Fade, Divider
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import GoogleIcon from '@mui/icons-material/Google';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import StatusIntelligentDashboard from './dashboard';

export default function SaaSGateway() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); 
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      if (tab === 0) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) { setError(err.message.replace('Firebase:', '')); }
  };

  const handleGoogleSignIn = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (err: any) { setError("Google Sign-In failed."); }
  };

  const handleResetPassword = async () => {
    if (!email) { setError("Please enter your email first."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset link sent to your email!");
      setError('');
    } catch (err: any) { setError("Failed to send reset email."); }
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <CircularProgress sx={{ color: '#10b981' }} />
    </Box>
  );

  if (user) return <StatusIntelligentDashboard user={user} />;

  return (
    <Box sx={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      bgcolor: '#0f172a',
      backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), url("./bg-image.avif")',
      backgroundSize: 'cover'
    }}>
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 8, backdropFilter: 'blur(16px)', bgcolor: 'rgba(255,255,255,0.95)', textAlign: 'center' }}>
          <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: '#10b981', width: 56, height: 56, mb: 1 }}><ShieldIcon sx={{ fontSize: 32 }} /></Avatar>
            <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-2px' }}>FARMER'S <span style={{ color: '#10b981' }}>FRIEND</span></Typography>
          </Stack>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: '#10b981' } }}>
            <Tab label="Login" sx={{ fontWeight: 800 }} /><Tab label="Join" sx={{ fontWeight: 800 }} />
          </Tabs>

          <form onSubmit={handleAuth}>
            <Stack spacing={2}>
              <TextField label="Email" variant="filled" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Password" variant="filled" type={showPassword ? 'text' : 'password'} fullWidth required 
                value={password} onChange={(e) => setPassword(e.target.value)}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                  </InputAdornment>
                )}}
              />
              
              {tab === 0 && (
                <Typography onClick={handleResetPassword} variant="caption" sx={{ textAlign: 'right', cursor: 'pointer', color: '#10b981', fontWeight: 700 }}>
                  Forgot Password?
                </Typography>
              )}

              {error && <Typography color="error" variant="caption" sx={{ fontWeight: 700 }}>{error}</Typography>}
              {message && <Typography color="primary" variant="caption" sx={{ fontWeight: 700 }}>{message}</Typography>}
              
              <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.5, borderRadius: 3, bgcolor: '#0f172a', fontWeight: '900' }}>
                {tab === 0 ? 'Sign In' : 'Get Started'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3, fontWeight: 700, fontSize: '0.7rem', color: alpha('#000', 0.3) }}>OR CONTINUE WITH</Divider>

          <Button 
            fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleSignIn}
            sx={{ py: 1.5, borderRadius: 3, fontWeight: 900, color: '#0f172a', borderColor: '#e2e8f0', textTransform: 'none' }}
          >
            Google Account
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}