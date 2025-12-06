import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Subject as SubjectIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  PlayArrow as PlayArrowIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import studentService from '../../services/studentService';

const SubjectDetails = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedTextContent, setExpandedTextContent] = useState({});

  useEffect(() => {
    loadSubjectDetails();
  }, [subjectId]);

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the subject data from dashboard
      const dashboardData = await studentService.getDashboardData();
      const subject = dashboardData.subjects.find(s => s.subject_id === subjectId);

      if (!subject) {
        setError('Subject not found');
        return;
      }

      // Get the actual content for this subject from the API
      const contentResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/content/subjects/${subjectId}/content-tree`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!contentResponse.ok) {
        throw new Error('Failed to fetch content');
      }

      const contentData = await contentResponse.json();

      setSubjectData({
        ...subject,
        modules: contentData.modules || []
      });

    } catch (err) {
      console.error('Error loading subject details:', err);
      setError(err.response?.data?.detail || 'Failed to load subject details');

      // Fallback to mock data if API fails
      console.log('Falling back to mock data due to API error');
      const mockSubject = {
        subject_id: subjectId,
        subject: { name: 'Sample Subject', code: 'SUB101' },
        teacher: { email: 'teacher@example.com' },
        is_compulsory: true,
        credits: 3,
        academic_year: '2024-2025',
        modules: []
      };
      setSubjectData(mockSubject);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'ppt':
      case 'pptx':
        return <ArticleIcon color="warning" />;
      case 'video':
        return <PlayArrowIcon color="primary" />;
      case 'image':
        return <ImageIcon color="success" />;
      case 'text':
        return <DescriptionIcon color="info" />;
      default:
        return <DescriptionIcon />;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student/dashboard');
  };

  const handleViewContent = (content) => {
    try {
      if (content.content_type === 'text') {
        // Toggle text content visibility
        setExpandedTextContent(prev => ({
          ...prev,
          [content.id]: !prev[content.id]
        }));
        setSnackbar({
          open: true,
          message: expandedTextContent[content.id] ? `Hiding text content: ${content.title}` : `Viewing text content: ${content.title}`,
          severity: 'info'
        });
      } else if (content.file_url) {
        // Use the backend file URL
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const fullUrl = content.file_url.startsWith('http')
          ? content.file_url
          : `${backendUrl}${content.file_url}`;

        window.open(fullUrl, '_blank');
        setSnackbar({
          open: true,
          message: `Opening ${content.title} in new tab`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `No file available for ${content.title}`,
          severity: 'warning'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error opening content: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleDownloadContent = async (content) => {
    try {
      if (content.file_url) {
        setSnackbar({
          open: true,
          message: `Preparing download for ${content.title}...`,
          severity: 'info'
        });

        // For downloads, use the API endpoint which includes proper headers
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const filename = content.file_url.split('/').pop(); // Extract filename from URL
        const downloadUrl = `${backendUrl}/api/content/files/${filename}`;

        // Fetch the file as a blob to ensure download prompt
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create download link with blob URL
        const link = document.createElement('a');
        link.href = url;
        link.download = content.file_name || `${content.title}.${content.content_type}`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSnackbar({
          open: true,
          message: `Downloaded ${content.title} successfully`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `No file available for download: ${content.title}`,
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: `Error downloading file: ${error.message}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !subjectData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Subject not found'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

        <Box display="flex" alignItems="center" mb={2}>
          <SubjectIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {subjectData.subject?.name || 'N/A'}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {subjectData.subject?.code || 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip
            label={subjectData.is_compulsory ? 'Compulsory' : 'Elective'}
            color={subjectData.is_compulsory ? 'primary' : 'secondary'}
            size="small"
          />
          {subjectData.credits && (
            <Chip label={`${subjectData.credits} Credits`} variant="outlined" size="small" />
          )}
          {subjectData.academic_year && (
            <Chip label={subjectData.academic_year} variant="outlined" size="small" />
          )}
        </Box>

        {subjectData.teacher && subjectData.teacher.email && (
          <Typography variant="body1" sx={{ mt: 2, color: 'primary.main' }}>
            Teacher: {subjectData.teacher.email}
          </Typography>
        )}
      </Box>

      {/* Subject Description */}
      {subjectData.subject?.description && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1">
              {subjectData.subject.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Modules and Content */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Course Content
      </Typography>

      {subjectData.modules && subjectData.modules.length > 0 ? (
        <Box>
          {subjectData.modules.map((module) => (
            <Card key={module.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    p: 1,
                    borderRadius: 1
                  }}
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <Box sx={{ mr: 2 }}>
                    {expandedModules[module.id] ? (
                      <FolderOpenIcon color="primary" />
                    ) : (
                      <FolderIcon color="primary" />
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {module.name}
                    </Typography>
                    {module.description && (
                      <Typography variant="body2" color="text.secondary">
                        {module.description}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small">
                    {expandedModules[module.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={expandedModules[module.id]}>
                  <Box sx={{ mt: 2, pl: 4 }}>
                    {module.submodules && module.submodules.length > 0 ? (
                      module.submodules.map((submodule) => (
                        <Box key={submodule.id} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            📁 {submodule.name}
                          </Typography>
                          {submodule.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 3 }}>
                              {submodule.description}
                            </Typography>
                          )}

                          {submodule.contents && submodule.contents.length > 0 ? (
                            <List dense sx={{ ml: 3 }}>
                              {submodule.contents.map((content) => (
                                <Box key={content.id}>
                                  <ListItem
                                    sx={{
                                      px: 0,
                                      '&:hover': { bgcolor: 'action.hover' },
                                      borderRadius: 1
                                    }}
                                    secondaryAction={
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleViewContent(content)}
                                          title={content.content_type === 'text' ?
                                            (expandedTextContent[content.id] ? "Hide Content" : "View Content") :
                                            "View Content"}
                                        >
                                          <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        {content.content_type !== 'text' && (
                                          <IconButton
                                            size="small"
                                            color="secondary"
                                            onClick={() => handleDownloadContent(content)}
                                            title="Download File"
                                          >
                                            <DownloadIcon fontSize="small" />
                                          </IconButton>
                                        )}
                                      </Box>
                                    }
                                  >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                      {getContentIcon(content.content_type)}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={content.title}
                                      secondary={
                                        content.file_name ?
                                          `${content.content_type.toUpperCase()} • ${content.file_name}` :
                                          content.content_type.toUpperCase()
                                      }
                                    />
                                  </ListItem>

                                  {/* Expanded text content */}
                                  {content.content_type === 'text' && expandedTextContent[content.id] && (
                                    <Box
                                      sx={{
                                        ml: 6,
                                        mt: 1,
                                        p: 2,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {content.content_data || 'No content available'}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontStyle: 'italic' }}>
                              No content available
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontStyle: 'italic' }}>
                        No submodules available
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Alert severity="info">
          No course content available for this subject yet.
        </Alert>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SubjectDetails;
