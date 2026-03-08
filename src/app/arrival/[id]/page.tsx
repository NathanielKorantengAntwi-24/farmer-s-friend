'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, doc, setDoc, getDoc, onAuthStateChanged } from '@/lib/firebase';
import { 
  Container, Typography, Box, TextField, MenuItem, Button, 
  Paper, Stack, CircularProgress, alpha, Avatar, IconButton, Divider 
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export default function ArrivalPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [farm, setFarm] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    eyeRecession: '',   
    skinTent: '',       
    attitude: '',     
    suckleReflex: '', 
    usg: '',                
    urineKetones: 'Negative' 
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "calves", id as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().farm) {
              setFarm(userSnap.data().farm);
            }
            setLoading(false);
          } else {
            router.push('/');
          }
        } catch (e) {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [hasMounted, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, "calves", id as string), {
        status: 'arrived',
        arrival: formData,
        arrivalCompletedAt: new Date()
      }, { merge: true });
      router.push(`/results/${id}`);
    } catch (err) {
      console.error("Save error:", err);
      setIsSaving(false);
    }
  };

  if (!hasMounted) return null;

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <CircularProgress sx={{ color: '#10b981' }} />
    </Box>
  );

  return (
    <Box sx={{ 
    minHeight: '100vh', 
    pb: 12, 
    // Replace 'farm-background.jpg' with your actual image filename in the /public folder
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8)), url('./bg-image.avif')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed' // Keeps the image still while you scroll
  }}>
      <Container maxWidth="sm">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => router.push('/')} sx={{ color: alpha('#fff', 0.8) }}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" fontWeight="700" color={alpha('#fff', 0.6)}>Back to Dashboard</Typography>
        </Stack>

        {farm?.name && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight="900" sx={{ color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>{farm.name}</Typography>
            {farm.address && <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>{farm.address}</Typography>}
          </Box>
        )}

        <Paper sx={{ p: 4, borderRadius: 8, bgcolor: 'rgba(255,255,255,0.98)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
            <Avatar sx={{ bgcolor: '#0f172a', width: 32, height: 32 }}><ShieldIcon sx={{ fontSize: 18 }} /></Avatar>
            <Typography variant="h5" fontWeight="900" color="#0f172a">C. Arrival Assessment</Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField 
                select label="Eye recession" variant="filled" fullWidth required
                value={formData.eyeRecession} 
                onChange={(e) => setFormData({...formData, eyeRecession: e.target.value})}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Mild">Mild</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
              </TextField>

              <TextField 
                select label="Skin tent" variant="filled" fullWidth required
                value={formData.skinTent} 
                onChange={(e) => setFormData({...formData, skinTent: e.target.value})}
              >
                <MenuItem value="<2 s">&lt; 2 s</MenuItem>
                <MenuItem value="2–6 s">2–6 s</MenuItem>
                <MenuItem value=">6 s">&gt; 6 s</MenuItem>
              </TextField>

              <TextField 
                select label="Attitude" variant="filled" fullWidth required
                value={formData.attitude} 
                onChange={(e) => setFormData({...formData, attitude: e.target.value})}
              >
                <MenuItem value="Bright">Bright</MenuItem>
                <MenuItem value="Depressed">Depressed</MenuItem>
              </TextField>

              <TextField 
                select label="Suckle reflex" variant="filled" fullWidth required
                value={formData.suckleReflex} 
                onChange={(e) => setFormData({...formData, suckleReflex: e.target.value})}
              >
                <MenuItem value="Strong">Strong</MenuItem>
                <MenuItem value="Weak">Weak</MenuItem>
              </TextField>

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" fontWeight="800" color="text.secondary">OPTIONAL URINE INDICATORS</Typography>
              </Divider>

              <TextField 
                label="Urine specific gravity (USG)" 
                variant="filled" 
                fullWidth 
                placeholder="e.g. 1.025" 
                value={formData.usg} 
                onChange={(e) => setFormData({...formData, usg: e.target.value})} 
              />

              <TextField 
                select label="Urine ketones" variant="filled" fullWidth 
                value={formData.urineKetones} 
                onChange={(e) => setFormData({...formData, urineKetones: e.target.value})}
              >
                <MenuItem value="Negative">Negative</MenuItem>
                <MenuItem value="Trace">Trace</MenuItem>
                <MenuItem value="+">+</MenuItem>
                <MenuItem value="++">++</MenuItem>
              </TextField>

              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large" 
                disabled={isSaving} 
                sx={{ py: 2, borderRadius: 4, bgcolor: '#0f172a', fontWeight: 900, mt: 2, textTransform: 'none' }}
              >
                {isSaving ? "Saving Assessment..." : "Generate Final Report"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}