'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, doc, updateDoc, getDoc, onAuthStateChanged } from '@/lib/firebase';
import { 
  Container, Typography, Box, Button, Paper, Stack, 
  CircularProgress, MenuItem, TextField, Avatar, Fade, alpha, IconButton
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { QRCodeCanvas } from 'qrcode.react';

export default function TransportPage() {
  const params = useParams();
  const id = params?.id; 
  const router = useRouter();
  
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [farm, setFarm] = useState<any>(null);
  
  const [transportUpdates, setTransportUpdates] = useState({
    actualDurationSoFar: '', 
    stressExposure: 'None',
    delays: 'No'
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
        } catch (error) {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [hasMounted, id, router]);

  const handleUpdateTransport = async (e: React.FormEvent) => {
    e.preventDefault(); // Form handles validation now
    if (!id) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "calves", id as string), {
        status: 'in-transport',
        inTransportUpdates: {
          ...transportUpdates,
          updatedAt: new Date()
        }
      });
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setIsUpdating(false);
    }
  };

  const getArrivalUrl = () => {
    if (!hasMounted || typeof window === 'undefined') return '';
    return `${window.location.origin}/arrival/${id}`;
  };

  if (!hasMounted) return null;

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <CircularProgress sx={{ color: '#10b981' }} />
    </Box>
  );

  if (showSuccess) {
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
        <Fade in={showSuccess}>
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 8, width: '100%', maxWidth: 400, mx: 'auto' }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
            <Typography variant="h5" fontWeight="900">Journey Updated</Typography>
            <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">Scan to perform <b>C. Arrival Assessment</b></Typography>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 4, mb: 4, border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
              <QRCodeCanvas value={getArrivalUrl()} size={200} />
            </Box>
            <Button fullWidth variant="contained" onClick={() => router.push('/')} sx={{ py: 2, borderRadius: 3, bgcolor: '#0f172a', fontWeight: 'bold' }}>
              Back to Dashboard
            </Button>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: '#0f172a' }}>
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
          <form onSubmit={handleUpdateTransport}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: '#0f172a', width: 32, height: 32 }}><LocalShippingIcon sx={{ fontSize: 18 }} /></Avatar>
                <Typography variant="h5" fontWeight="900" color="#0f172a">B. In-Transport Updates</Typography>
              </Stack>
              
              <TextField 
                label="Actual duration so far (hours)" 
                variant="filled" 
                type="number" 
                fullWidth 
                required 
                value={transportUpdates.actualDurationSoFar} 
                onChange={(e) => setTransportUpdates({...transportUpdates, actualDurationSoFar: e.target.value})} 
              />
              
              <TextField 
                select 
                label="Heat or cold stress exposure" 
                variant="filled" 
                fullWidth 
                required
                value={transportUpdates.stressExposure} 
                onChange={(e) => setTransportUpdates({...transportUpdates, stressExposure: e.target.value})}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Severe">Severe</MenuItem>
              </TextField>
              
              <TextField 
                select 
                label="Delays or extended stops" 
                variant="filled" 
                fullWidth 
                required
                value={transportUpdates.delays} 
                onChange={(e) => setTransportUpdates({...transportUpdates, delays: e.target.value})}
              >
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
              </TextField>

              <Button 
                type="submit"
                variant="contained" 
                fullWidth 
                size="large" 
                disabled={isUpdating} 
                sx={{ py: 2, borderRadius: 4, bgcolor: '#0f172a', fontWeight: 900, textTransform: 'none' }}
              >
                {isUpdating ? "Saving..." : "Generate Arrival Code"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}