import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PowerSettingsNew as PowerSettingsNewIcon,
  People as PeopleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [schoolDialog, setSchoolDialog] = useState({ open: false, mode: 'create', data: {} });
  const [subadminDialog, setSubadminDialog] = useState({ open: false, schoolId: null });
  const [subadminsViewDialog, setSubadminsViewDialog] = useState({ open: false, schoolId: null, schoolName: '' });
  const [subadminEditDialog, setSubadminEditDialog] = useState({ open: false, subadmin: null });
  const [subadminsList, setSubadminsList] = useState([]);

  // Form data
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }
  });

  const [subadminForm, setSubadminForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }
  });

  const [subadminEditForm, setSubadminEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSchools();
      setSchools(data);
    } catch (err) {
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolDialogOpen = (mode = 'create', school = null) => {
    setSchoolDialog({
      open: true,
      mode,
      data: school || {}
    });
    if (school) {
      setSchoolForm({
        name: school.name || '',
        address: parseAddressToObject(school.address)
      });
    } else {
      setSchoolForm({
        name: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postal_code: ''
        }
      });
    }
  };

  const handleSchoolDialogClose = () => {
    setSchoolDialog({ open: false, mode: 'create', data: {} });
    setSchoolForm({
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }
    });
  };

  const handleSubadminDialogOpen = (schoolId) => {
    setSubadminDialog({ open: true, schoolId });
    setSubadminForm({
      email: '',
      password: '',
      name: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }
    });
  };

  const handleSubadminDialogClose = () => {
    setSubadminDialog({ open: false, schoolId: null });
    setSubadminForm({
      email: '',
      password: '',
      name: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }
    });
  };

  const handleCreateSchool = async () => {
    try {
      await adminService.createSchool(schoolForm);
      setSuccess('School created successfully');
      handleSchoolDialogClose();
      loadSchools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create school');
    }
  };

  const handleCreateSubadmin = async () => {
    try {
      const subadminData = {
        ...subadminForm,
        school_id: subadminDialog.schoolId
      };
      await adminService.createSubadmin(subadminData);
      setSuccess('Subadmin created successfully');
      handleSubadminDialogClose();
      loadSchools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create subadmin');
    }
  };

  const handleViewSubadmins = async (schoolId, schoolName) => {
    try {
      setLoading(true);
      const subadmins = await adminService.getSchoolSubadmins(schoolId);
      setSubadminsList(subadmins);
      setSubadminsViewDialog({ open: true, schoolId, schoolName });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load subadmins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubadminsViewClose = () => {
    setSubadminsViewDialog({ open: false, schoolId: null, schoolName: '' });
    setSubadminsList([]);
  };

  const handleEditSubadmin = (subadmin) => {
    setSubadminEditForm({
      name: subadmin.name || '',
      email: subadmin.email || '',
      phone: subadmin.phone || '',
      password: '',
      address: parseAddressToObject(subadmin.address)
    });
    setSubadminEditDialog({ open: true, subadmin });
  };

  const handleSubadminEditClose = () => {
    setSubadminEditDialog({ open: false, subadmin: null });
    setSubadminEditForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }
    });
  };

  const handleUpdateSubadmin = async () => {
    try {
      const updateData = {
        ...subadminEditForm
      };
      // Remove password if empty
      if (!updateData.password) {
        delete updateData.password;
      }
      await adminService.updateSubadmin(subadminEditDialog.subadmin.id, updateData);
      setSuccess('Subadmin updated successfully');
      handleSubadminEditClose();
      // Refresh subadmins list if dialog is open
      if (subadminsViewDialog.open) {
        const subadmins = await adminService.getSchoolSubadmins(subadminsViewDialog.schoolId);
        setSubadminsList(subadmins);
      }
      loadSchools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update subadmin');
    }
  };

  const handleToggleSchoolStatus = async (schoolId, currentStatus) => {
    try {
      await adminService.toggleSchoolStatus(schoolId, !currentStatus);
      setSuccess(`School ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadSchools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update school status');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Helper function to parse address string and extract city and state for display
  const parseAddress = (address) => {
    if (!address) return 'N/A';
    
    // If address is already an object, return city and state
    if (typeof address === 'object' && address.city && address.state) {
      return `${address.city}, ${address.state}`;
    }
    
    // If address is a string, parse it
    if (typeof address === 'string') {
      const parts = address.split(',').map(part => part.trim());
      // Format: street, city, state, country, postal_code
      if (parts.length >= 3) {
        const city = parts[parts.length - 4] || parts[parts.length - 3] || '';
        const state = parts[parts.length - 3] || parts[parts.length - 2] || '';
        if (city && state) {
          return `${city}, ${state}`;
        }
        // Fallback: show last two parts (usually state and country, or city and state)
        return parts.slice(-2).join(', ');
      }
      // If format is different, show the full address
      return address;
    }
    
    return 'N/A';
  };

  // Helper function to parse address string into object for form editing
  const parseAddressToObject = (address) => {
    if (!address) {
      return {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      };
    }
    
    // If already an object, return it
    if (typeof address === 'object') {
      return address;
    }
    
    // If string, parse it
    if (typeof address === 'string') {
      const parts = address.split(',').map(part => part.trim());
      // Format: street, city, state, country, postal_code
      return {
        street: parts[0] || '',
        city: parts[1] || '',
        state: parts[2] || '',
        country: parts[3] || '',
        postal_code: parts[4] || ''
      };
    }
    
    return {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    };
  };

  const handleFormChange = (field, value, formType) => {
    if (formType === 'school') {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        setSchoolForm({
          ...schoolForm,
          [parent]: {
            ...schoolForm[parent],
            [child]: value
          }
        });
      } else {
        setSchoolForm({
          ...schoolForm,
          [field]: value
        });
      }
    } else {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        setSubadminForm({
          ...subadminForm,
          [parent]: {
            ...subadminForm[parent],
            [child]: value
          }
        });
      } else {
        setSubadminForm({
          ...subadminForm,
          [field]: value
        });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Schools</Typography>
              </Box>
              <Typography variant="h4">{schools.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonAddIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Subadmins</Typography>
              </Box>
              <Typography variant="h4">
                {schools.reduce((total, school) => total + (school.subadmins?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleSchoolDialogOpen('create')}
            >
              Create School
            </Button>
          </Box>
        </Grid>

        {/* Schools Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Schools Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>School Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Subadmins</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>
                        {parseAddress(school.address)}
                      </TableCell>
                      <TableCell>{school.subadmins?.length || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={school.is_active ? 'Active' : 'Inactive'}
                          color={school.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Subadmins">
                          <IconButton
                            color="info"
                            onClick={() => handleViewSubadmins(school.id, school.name)}
                          >
                            <PeopleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Subadmin">
                          <IconButton
                            color="primary"
                            onClick={() => handleSubadminDialogOpen(school.id)}
                          >
                            <PersonAddIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={school.is_active ? 'Deactivate School' : 'Activate School'}>
                          <IconButton
                            color={school.is_active ? 'warning' : 'success'}
                            onClick={() => handleToggleSchoolStatus(school.id, school.is_active)}
                          >
                            <PowerSettingsNewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit School">
                          <IconButton
                            color="secondary"
                            onClick={() => handleSchoolDialogOpen('edit', school)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* School Dialog */}
      <Dialog open={schoolDialog.open} onClose={handleSchoolDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {schoolDialog.mode === 'create' ? 'Create New School' : 'Edit School'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="School Name"
            fullWidth
            value={schoolForm.name}
            onChange={(e) => handleFormChange('name', e.target.value, 'school')}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>Address</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Street"
                fullWidth
                value={schoolForm.address.street}
                onChange={(e) => handleFormChange('address.street', e.target.value, 'school')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="City"
                fullWidth
                value={schoolForm.address.city}
                onChange={(e) => handleFormChange('address.city', e.target.value, 'school')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="State"
                fullWidth
                value={schoolForm.address.state}
                onChange={(e) => handleFormChange('address.state', e.target.value, 'school')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Country"
                fullWidth
                value={schoolForm.address.country}
                onChange={(e) => handleFormChange('address.country', e.target.value, 'school')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Postal Code"
                fullWidth
                value={schoolForm.address.postal_code}
                onChange={(e) => handleFormChange('address.postal_code', e.target.value, 'school')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSchoolDialogClose}>Cancel</Button>
          <Button onClick={handleCreateSchool} variant="contained">
            {schoolDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subadmin Dialog */}
      <Dialog open={subadminDialog.open} onClose={handleSubadminDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Subadmin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                label="Name"
                fullWidth
                value={subadminForm.name}
                onChange={(e) => handleFormChange('name', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={subadminForm.email}
                onChange={(e) => handleFormChange('email', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={subadminForm.password}
                onChange={(e) => handleFormChange('password', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={subadminForm.phone}
                onChange={(e) => handleFormChange('phone', e.target.value, 'subadmin')}
              />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Address</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Street"
                fullWidth
                value={subadminForm.address.street}
                onChange={(e) => handleFormChange('address.street', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="City"
                fullWidth
                value={subadminForm.address.city}
                onChange={(e) => handleFormChange('address.city', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="State"
                fullWidth
                value={subadminForm.address.state}
                onChange={(e) => handleFormChange('address.state', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Country"
                fullWidth
                value={subadminForm.address.country}
                onChange={(e) => handleFormChange('address.country', e.target.value, 'subadmin')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Postal Code"
                fullWidth
                value={subadminForm.address.postal_code}
                onChange={(e) => handleFormChange('address.postal_code', e.target.value, 'subadmin')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubadminDialogClose}>Cancel</Button>
          <Button onClick={handleCreateSubadmin} variant="contained">
            Create Subadmin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subadmins View Dialog */}
      <Dialog open={subadminsViewDialog.open} onClose={handleSubadminsViewClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Subadmins - {subadminsViewDialog.schoolName}
        </DialogTitle>
        <DialogContent>
          {subadminsList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No subadmins found for this school.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subadminsList.map((subadmin) => (
                    <TableRow key={subadmin.id}>
                      <TableCell>{subadmin.name}</TableCell>
                      <TableCell>{subadmin.email}</TableCell>
                      <TableCell>{subadmin.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={subadmin.is_active ? 'Active' : 'Inactive'}
                          color={subadmin.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Subadmin">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEditSubadmin(subadmin)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubadminsViewClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Subadmin Edit Dialog */}
      <Dialog open={subadminEditDialog.open} onClose={handleSubadminEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Subadmin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                label="Name"
                fullWidth
                value={subadminEditForm.name}
                onChange={(e) => setSubadminEditForm({ ...subadminEditForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={subadminEditForm.email}
                onChange={(e) => setSubadminEditForm({ ...subadminEditForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={subadminEditForm.phone}
                onChange={(e) => setSubadminEditForm({ ...subadminEditForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="New Password (leave blank to keep current)"
                type="password"
                fullWidth
                value={subadminEditForm.password}
                onChange={(e) => setSubadminEditForm({ ...subadminEditForm, password: e.target.value })}
              />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Address</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Street"
                fullWidth
                value={subadminEditForm.address.street}
                onChange={(e) => setSubadminEditForm({
                  ...subadminEditForm,
                  address: { ...subadminEditForm.address, street: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="City"
                fullWidth
                value={subadminEditForm.address.city}
                onChange={(e) => setSubadminEditForm({
                  ...subadminEditForm,
                  address: { ...subadminEditForm.address, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="State"
                fullWidth
                value={subadminEditForm.address.state}
                onChange={(e) => setSubadminEditForm({
                  ...subadminEditForm,
                  address: { ...subadminEditForm.address, state: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Country"
                fullWidth
                value={subadminEditForm.address.country}
                onChange={(e) => setSubadminEditForm({
                  ...subadminEditForm,
                  address: { ...subadminEditForm.address, country: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Postal Code"
                fullWidth
                value={subadminEditForm.address.postal_code}
                onChange={(e) => setSubadminEditForm({
                  ...subadminEditForm,
                  address: { ...subadminEditForm.address, postal_code: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubadminEditClose}>Cancel</Button>
          <Button onClick={handleUpdateSubadmin} variant="contained">
            Update Subadmin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
