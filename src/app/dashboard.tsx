'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, collection, addDoc, query, getDocs, orderBy, updateDoc, doc, deleteDoc, where, signOut, getDoc, setDoc } from '@/lib/firebase';
import { 
  Box, Typography, TextField, MenuItem, Button, Paper, Stack, 
  Table, TableBody, TableCell, TableContainer, TableRow, 
  Chip, alpha, Avatar, IconButton, Modal, Fade,
  Fab, BottomNavigation, BottomNavigationAction, Container,
  Dialog, DialogTitle, DialogActions, InputAdornment
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import ShieldIcon from '@mui/icons-material/Shield';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LogoutIcon from '@mui/icons-material/Logout';
import PendingActionsIcon from '@mui/icons-material/PendingActions'; 
import LocationOnIcon from '@mui/icons-material/LocationOn';          
import AssessmentIcon from '@mui/icons-material/Assessment';          
import SettingsIcon from '@mui/icons-material/Settings';

export default function StatusIntelligentDashboard({ user }: { user: any }) {
  const [calves, setCalves] = useState<any[]>([]);
  const [successData, setSuccessData] = useState<{id: string, status: string} | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [navValue, setNavValue] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMounted, setHasMounted] = useState(false); 
  
  const [archiveConfirm, setArchiveConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [permanentConfirm, setPermanentConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  
  const [formData, setFormData] = useState({
    calfAge: '', colostrumStatus: 'Adequate', lastFeeding: '', plannedDuration: '', ambientTemp: 'Mild'
  });

  const [farmDetails, setFarmDetails] = useState({ name: '', address: '' });

  // 1. Initial mounting guard
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Farmer";
  const photoURL = user?.photoURL || "";

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No Date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (user && hasMounted) {
      fetchCalves();
      fetchFarmDetails();
    }
  }, [successData, user, hasMounted]);

  const fetchCalves = async () => {
    try {
      const q = query(
        collection(db, "calves"), 
        where("ownerId", "==", user.uid), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      setCalves(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  const fetchFarmDetails = async () => {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().farm) {
        setFarmDetails(docSnap.data().farm);
      }
    } catch (e) {
      console.error("Fetch settings error:", e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, "users", user.uid), { farm: farmDetails }, { merge: true });
      setOpenSettings(false);
    } catch (e) {
      console.error("Save settings error:", e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pre-transport': return <PendingActionsIcon fontSize="small" />;
      case 'in-transport': return <LocalShippingIcon fontSize="small" />;
      case 'arrived': return <LocationOnIcon fontSize="small" />;
      default: return <AssessmentIcon fontSize="small" />;
    }
  };

  const getNextStepUrl = (id: string, currentStatus: string) => {
    if (typeof window === 'undefined') return ''; 
    const baseUrl = window.location.origin;
    const path = currentStatus === 'pre-transport' ? 'transport' : currentStatus === 'in-transport' ? 'arrival' : 'results';
    return `${baseUrl}/${path}/${id}`;
  };

  const displayedCalves = useMemo(() => {
    const baseList = navValue === 0 
      ? calves.filter(c => c.status !== 'archived') 
      : calves.filter(c => c.status === 'archived');
    return searchQuery ? baseList.filter(c => c.id.toLowerCase().includes(searchQuery.toLowerCase())) : baseList;
  }, [calves, navValue, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "calves"), {
        ownerId: user.uid,
        status: "pre-transport",
        createdAt: new Date(),
        preTransport: formData,
      });
      setSuccessData({ id: docRef.id, status: "pre-transport" });
      setOpenModal(false);
      setFormData({ calfAge: '', colostrumStatus: 'Adequate', lastFeeding: '', plannedDuration: '', ambientTemp: 'Mild' });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleToggleArchive = async (id: string, undo = false) => {
    const target = calves.find(c => c.id === id);
    const newStatus = undo ? (target?.previousStatus || 'pre-transport') : 'archived';
    const updatePayload: any = { status: newStatus };
    if (!undo) updatePayload.previousStatus = target?.status;

    setCalves(prev => prev.map(c => c.id === id ? { ...c, ...updatePayload } : c));
    await updateDoc(doc(db, "calves", id), updatePayload);
    setArchiveConfirm({ open: false, id: null });
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "calves", id));
      setCalves(prev => prev.filter(c => c.id !== id));
      setPermanentConfirm({ open: false, id: null });
    } catch (error) {
      console.error("Delete failed:", error);
      setPermanentConfirm({ open: false, id: null });
    }
  };

  // Guard for server-side rendering
  if (!hasMounted) return null;

  if (successData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', p: 2, bgcolor: '#0f172a' }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 8, width: '100%', maxWidth: 400, mx: 'auto' }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
          <Typography variant="h5" fontWeight="900">Success!</Typography>
          <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">Scan to begin <b>In-Transport</b> updates</Typography>
          <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 4, mb: 4, border: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
            <QRCodeCanvas value={getNextStepUrl(successData.id, successData.status)} size={200} />
          </Box>
          <Button fullWidth variant="contained" onClick={() => setSuccessData(null)} sx={{ py: 2, borderRadius: 3, bgcolor: '#0f172a', fontWeight: 'bold' }}>
            Back to Active
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
    minHeight: '100vh', 
    pb: 12, 
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8)), url('/bg-image.avif')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed' 
  }}>
      
      {/* HEADER */}
      <Box sx={{ p: 3, pt: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={photoURL} sx={{ width: 48, height: 48, border: '2px solid #10b981', bgcolor: '#10b981' }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 600 }}>{greeting},</Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1 }}>{displayName}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setOpenSettings(true)} sx={{ color: alpha('#fff', 0.6), bgcolor: 'rgba(255,255,255,0.05)' }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => signOut(auth)} sx={{ color: alpha('#fff', 0.6), bgcolor: 'rgba(255,255,255,0.05)' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mb: 4 }}>
          <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}><ShieldIcon sx={{ fontSize: 18 }} /></Avatar>
          <Typography variant="h5" fontWeight="900" color="#fff" sx={{ letterSpacing: '-1.5px' }}>FARMER'S <span style={{ color: '#10b981' }}>FRIEND</span></Typography>
        </Stack>

        <TextField 
          fullWidth placeholder="Search by ID..." value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          InputProps={{ 
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: alpha('#fff', 0.5) }} /></InputAdornment>, 
            sx: { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', '& fieldset': { border: 'none' } }
          }} 
        />
      </Box>

      <Container maxWidth="md">
        <Paper sx={{ borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.98)' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <Typography variant="subtitle1" fontWeight="900" color="#1e293b">{navValue === 0 ? "Active Records" : "History Log"}</Typography>
            <Chip label={displayedCalves.length} size="small" sx={{ fontWeight: 900, bgcolor: '#0f172a', color: '#fff' }} />
          </Box>
          
          <TableContainer>
            {displayedCalves.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: alpha('#0f172a', 0.05), mb: 2 }}>
                  {navValue === 0 ? (
                    <PendingActionsIcon sx={{ fontSize: 48, color: alpha('#0f172a', 0.2) }} />
                  ) : (
                    <HistoryIcon sx={{ fontSize: 48, color: alpha('#0f172a', 0.2) }} />
                  )}
                </Box>
                <Typography variant="h6" fontWeight="800" color="#1e293b">
                  {navValue === 0 ? "No Active Calves" : "History is Empty"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {navValue === 0 ? "Tap the '+' button to register a new calf." : "Archived records will appear here."}
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableBody>
                  {displayedCalves.map((calf) => (
                    <TableRow key={calf.id}>
                      <TableCell sx={{ py: 3 }}>
                        <Typography variant="body2" fontWeight="900" sx={{ color: '#0f172a' }}>
                          ID: {calf.id.substring(0, 8).toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: alpha('#000', 0.5), display: 'block', fontWeight: 600 }}>
                          Registered: {formatDate(calf.createdAt)}
                        </Typography>
                        <Chip label={(navValue === 0 ? calf.status : calf.previousStatus || 'archived').replace('-', ' ').toUpperCase()} size="small" sx={{ mt: 1, fontWeight: 900, fontSize: '0.6rem', bgcolor: (navValue === 0 ? calf.status : calf.previousStatus) === 'arrived' ? '#10b981' : '#f59e0b', color: '#fff' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {navValue === 0 ? (
                            <>
                              <Link href={getNextStepUrl(calf.id, calf.status)}>
                                <IconButton sx={{ bgcolor: '#0f172a', color: '#fff' }}>{getStatusIcon(calf.status)}</IconButton>
                              </Link>
                              <IconButton onClick={() => setArchiveConfirm({ open: true, id: calf.id })} sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.1) }}>
                                <DeleteSweepIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton onClick={() => handleToggleArchive(calf.id, true)} sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.1) }}>
                                <RestoreFromTrashIcon fontSize="small" />
                              </IconButton>
                              <IconButton onClick={() => setPermanentConfirm({ open: true, id: calf.id })} sx={{ color: '#000', bgcolor: alpha('#000', 0.1) }}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Paper>
      </Container>

      <Fab color="primary" onClick={() => setOpenModal(true)} sx={{ position: 'fixed', bottom: 100, right: 24, bgcolor: '#10b981' }}><AddIcon /></Fab>
      
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={10}>
        <BottomNavigation showLabels value={navValue} onChange={(e, v) => setNavValue(v)} sx={{ height: 80 }}>
          <BottomNavigationAction label="Active" icon={<DashboardIcon />} />
          <BottomNavigationAction label="History" icon={<HistoryIcon />} />
        </BottomNavigation>
      </Paper>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Fade in={openModal}>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, p: 4, pb: 6 }}>
            <Box sx={{ width: 40, height: 4, bgcolor: '#e2e8f0', borderRadius: 2, mx: 'auto', mb: 3 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="900">Pre-Transport Registration</Typography>
              <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
            </Stack>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField label="Calf age (days)" variant="filled" type="number" fullWidth required value={formData.calfAge} onChange={(e) => setFormData({...formData, calfAge: e.target.value})} />
                <TextField select label="Colostrum status" variant="filled" fullWidth value={formData.colostrumStatus} onChange={(e) => setFormData({...formData, colostrumStatus: e.target.value})}>
                  <MenuItem value="Adequate">Adequate</MenuItem>
                  <MenuItem value="Unknown">Unknown</MenuItem>
                  <MenuItem value="Inadequate">Inadequate</MenuItem>
                </TextField>
                <TextField label="Time since last milk or ORS (hours)" variant="filled" type="number" fullWidth value={formData.lastFeeding} onChange={(e) => setFormData({...formData, lastFeeding: e.target.value})} />
                <TextField label="Planned transport duration (hours)" variant="filled" type="number" fullWidth value={formData.plannedDuration} onChange={(e) => setFormData({...formData, plannedDuration: e.target.value})} />
                <TextField select label="Ambient temperature" variant="filled" fullWidth value={formData.ambientTemp} onChange={(e) => setFormData({...formData, ambientTemp: e.target.value})}>
                  <MenuItem value="Cool">Cool</MenuItem>
                  <MenuItem value="Mild">Mild</MenuItem>
                  <MenuItem value="Hot">Hot</MenuItem>
                </TextField>
                <Button type="submit" variant="contained" fullWidth sx={{ py: 2, borderRadius: 4, bgcolor: '#0f172a', fontWeight: '900' }}>Complete Registration</Button>
              </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>

      <Modal open={openSettings} onClose={() => setOpenSettings(false)}>
        <Fade in={openSettings}>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, p: 4, pb: 6 }}>
            <Box sx={{ width: 40, height: 4, bgcolor: '#e2e8f0', borderRadius: 2, mx: 'auto', mb: 3 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="900">Farm Settings</Typography>
              <IconButton onClick={() => setOpenSettings(false)}><CloseIcon /></IconButton>
            </Stack>
            <Stack spacing={2.5}>
              <TextField 
                label="Farm Name" variant="filled" fullWidth 
                value={farmDetails.name} onChange={(e) => setFarmDetails({...farmDetails, name: e.target.value})} 
              />
              <TextField 
                label="Farm Address" variant="filled" fullWidth multiline rows={2}
                value={farmDetails.address} onChange={(e) => setFarmDetails({...farmDetails, address: e.target.value})} 
              />
              <Button onClick={handleSaveSettings} variant="contained" fullWidth sx={{ py: 2, borderRadius: 4, bgcolor: '#0f172a', fontWeight: '900' }}>
                Save Farm Details
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      <Dialog open={archiveConfirm.open} onClose={() => setArchiveConfirm({ open: false, id: null })}><DialogTitle sx={{ fontWeight: 900 }}>Archive Record?</DialogTitle><DialogActions sx={{ p: 2 }}><Button onClick={() => setArchiveConfirm({ open: false, id: null })}>Cancel</Button><Button onClick={() => archiveConfirm.id && handleToggleArchive(archiveConfirm.id)} variant="contained" color="error">Archive</Button></DialogActions></Dialog>
      <Dialog open={permanentConfirm.open} onClose={() => setPermanentConfirm({ open: false, id: null })}><DialogTitle sx={{ fontWeight: 900, color: '#ef4444' }}>Wipe Permanently?</DialogTitle><DialogActions sx={{ p: 2 }}><Button onClick={() => setPermanentConfirm({ open: false, id: null })}>Cancel</Button><Button onClick={() => permanentConfirm.id && handlePermanentDelete(permanentConfirm.id)} variant="contained" sx={{ bgcolor: '#000' }}>Wipe Data</Button></DialogActions></Dialog>
    </Box>
  );
}