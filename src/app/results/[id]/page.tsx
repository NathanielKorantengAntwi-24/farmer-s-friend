'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, onAuthStateChanged } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Container, Typography, Box, Paper, Alert, Divider, 
  CircularProgress, Button, Stack, alpha 
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

function RecommendationItem({ text, color }: { text: string, color: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <CheckCircleIcon sx={{ color: color, fontSize: 22, mt: 0.3 }} />
      <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#334155', fontWeight: 500 }}>
        {text}
      </Typography>
    </Stack>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const calfId = params?.id as string;
  
  const [data, setData] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null); // State for farm branding
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const fetchAllData = async (uid: string) => {
      try {
        // 1. Fetch Calf Data
        const calfSnap = await getDoc(doc(db, "calves", calfId));
        if (calfSnap.exists()) {
          setData(calfSnap.data());
        }

        // 2. Fetch User/Farm Branding
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists() && userSnap.data().farm) {
          setFarm(userSnap.data().farm);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchAllData(user.uid);
      else router.push('/');
    });
    return () => unsubscribe();
  }, [calfId, router]);

  const assessmentDate = useMemo(() => {
    if (!data?.createdAt) return '';
    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [data]);

  const assessment = useMemo(() => {
    if (!data) return null;
    let baseScore = 0;
    const { preTransport, arrival, inTransportUpdates } = data;

    const age = parseFloat(preTransport?.calfAge || 0);
    const colostrum = preTransport?.colostrumStatus;
    const temp = preTransport?.ambientTemp;
    const plannedHrs = parseFloat(preTransport?.plannedDuration || 0);
    const actualHrs = parseFloat(arrival?.actualDuration || 0);

    let vulnerabilityFactor = 1.0;
    if (colostrum === 'Inadequate') vulnerabilityFactor += 0.5;
    if (colostrum === 'Unknown') vulnerabilityFactor += 0.2;
    if (age <= 3) vulnerabilityFactor += 0.3;

    const effectiveDuration = Math.max(plannedHrs, actualHrs);
    if (effectiveDuration > 12) baseScore += (4 * vulnerabilityFactor);
    else if (effectiveDuration > 8) baseScore += (2 * vulnerabilityFactor);
    
    if (temp === 'Hot') baseScore += 2;
    if (inTransportUpdates?.stressExposure === 'Severe') baseScore += 2;
    if (temp === 'Hot' && inTransportUpdates?.stressExposure === 'Severe') baseScore += 2;

    let clinicalScore = 0;
    if (arrival?.eyeRecession === 'Moderate') clinicalScore += 5;
    if (arrival?.eyeRecession === 'Mild') clinicalScore += 2;
    if (arrival?.skinTent === '>6 s') clinicalScore += 5;
    if (arrival?.skinTent === '2–6 s') clinicalScore += 2;
    if (arrival?.suckleReflex === 'Weak') clinicalScore += 4;
    if (arrival?.attitude === 'Depressed') clinicalScore += 3;

    const usgNum = parseFloat(arrival?.usg);
    if (!isNaN(usgNum) && usgNum > 1.040) clinicalScore += 1;
    if (arrival?.urineKetones === '++' || arrival?.urineKetones === '+') clinicalScore += 1;

    const finalScore = baseScore + clinicalScore;
    let risk: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    
    if (arrival?.skinTent === '>6 s' || arrival?.suckleReflex === 'Weak' || finalScore >= 8) {
      risk = 'HIGH';
    } else if (finalScore >= 4 || arrival?.eyeRecession === 'Mild' || arrival?.attitude === 'Depressed') {
      risk = 'MODERATE';
    }

    return { risk, score: Math.round(finalScore) };
  }, [data]);

  const config = {
    HIGH: { color: '#ef4444', label: 'RED — HIGH RISK', icon: <ErrorIcon /> },
    MODERATE: { color: '#f59e0b', label: 'YELLOW — MODERATE RISK', icon: <WarningIcon /> },
    LOW: { color: '#10b981', label: 'GREEN — LOW RISK', icon: <CheckCircleIcon /> }
  }[assessment?.risk || 'LOW'];

  if (!hasMounted || loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <CircularProgress sx={{ color: '#10b981' }} />
    </Box>
  );

  return (
    <Box sx={{ 
    minHeight: '100vh', 
    pb: 12, 
   
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8)), url('./bg-image.avif')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }}>
      <Container maxWidth="sm">
        <Button startIcon={<ChevronLeftIcon />} onClick={() => router.push('/')} sx={{ color: alpha('#fff', 0.6), mb: 2, '@media print': { display: 'none' } }}>
          Back to Dashboard
        </Button>

        <Paper elevation={0} sx={{ borderRadius: 6, overflow: 'hidden', bgcolor: '#fff' }}>
          
          {/* PROFESSIONAL BRANDING HEADER */}
          {farm?.name && (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
              <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ letterSpacing: '1px', textTransform: 'uppercase' }}>
                {farm.name}
              </Typography>
              {farm.address && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {farm.address}
                </Typography>
              )}
            </Box>
          )}

          {/* ASSESSMENT HEADER */}
          <Box sx={{ bgcolor: config.color, p: 4, color: 'white', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              {React.cloneElement(config.icon as React.ReactElement<any>, { sx: { fontSize: 40 } })}
            </Box>
            <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-1.5px', mb: 0.5 }}>
              {config.label}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ opacity: 0.9 }}>
              <CalendarMonthIcon sx={{ fontSize: 16 }} />
              <Typography variant="subtitle2" fontWeight="700">
                Assessed: {assessmentDate}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8, fontWeight: 700 }}>
              Decision Logic Outcome: {assessment?.score} Points
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="900" color="#0f172a" gutterBottom>
              Expert Nutritional Recommendations
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2.5}>
              {assessment?.risk === 'LOW' && (
                <>
                  <RecommendationItem text="ORS is not immediately required as a primary intervention for low-risk calves." color="#10b981" />
                  <RecommendationItem text="Focus management on consistent monitoring of hydration and intake levels post-arrival." color="#10b981" />
                  <RecommendationItem text="Specifically reassess clinical status if milk intake is delayed more than 6 hours." color="#10b981" />
                  <RecommendationItem text="Proceed with the established normal milk feeding schedule." color="#10b981" />
                </>
              )}

              {assessment?.risk === 'MODERATE' && (
                <>
                  <RecommendationItem text="Administer a mineral-based ORS upon arrival (volume based on calf size)." color="#f59e0b" />
                  <RecommendationItem text="Repeat ORS dosage within a 6 to 8-hour window if intake remains reduced." color="#f59e0b" />
                  <RecommendationItem text="Prioritize separate ORS administration; mixed feeding with milk replacer is flagged to be used with caution." color="#f59e0b" />
                  <RecommendationItem text="If colostrum status is inadequate or unknown, prioritize colostrum before the next milk feeding." color="#f59e0b" />
                </>
              )}

              {assessment?.risk === 'HIGH' && (
                <>
                  <RecommendationItem text="Immediate administration of ORS is required, with a follow-up dose within 6 hours." color="#ef4444" />
                  <RecommendationItem text="Do NOT mix milk replacer and ORS; administer ORS as the primary intervention." color="#ef4444" />
                  <RecommendationItem text="Delay milk feeding until hydration status significantly improves." color="#ef4444" />
                  <RecommendationItem text="Immediate colostrum intervention is required for these animals." color="#ef4444" />
                  <RecommendationItem text="Maintain continuous monitoring of metabolic and hydration changes." color="#ef4444" />
                  <Alert severity="error" variant="filled" sx={{ borderRadius: 3, fontWeight: 900, mt: 2, bgcolor: '#ef4444' }}>
                    VETERINARY EVALUATION RECOMMENDED
                  </Alert>
                </>
              )}
            </Stack>

            <Box sx={{ mt: 6, p: 3, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Stack direction="row" spacing={1.5}>
                <InfoIcon sx={{ color: '#64748b', fontSize: 20, mt: 0.3 }} />
                <Typography variant="caption" color="#64748b" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                  Mixed milk replacer and ORS feeding is acknowledged as a common field practice but is not recommended 
                  as the primary strategy for dehydrated calves within this framework. These protocols are designed 
                  to standardize nutritional intervention and do not replace professional veterinary diagnosis.
                </Typography>
              </Stack>
            </Box>
            
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={() => window.print()} 
              sx={{ 
                mt: 4, py: 2, bgcolor: '#0f172a', fontWeight: 900, borderRadius: 3,
                '@media print': { display: 'none' } 
              }}
            >
              Export Assessment Poster
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}