import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Subject as SubjectIcon,
  Grade as GradeIcon
} from '@mui/icons-material';

const TeacherProfileTab = ({ profile, loading, error }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Profile data not available.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Teacher Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View your profile information and assigned subjects
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1">{profile.name || 'Not specified'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email || 'Not specified'}
                </Typography>
              </Box>
            </Box>
            {profile.qualification && (
              <Box display="flex" alignItems="center" mb={2}>
                <SchoolIcon sx={{ mr: 2, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="body2">Qualification</Typography>
                  <Typography variant="body1">{profile.qualification}</Typography>
                </Box>
              </Box>
            )}
            {profile.specialization && (
              <Box display="flex" alignItems="center">
                <GradeIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2">Specialization</Typography>
                  <Typography variant="body1">{profile.specialization}</Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assigned Class Subjects
            </Typography>
            {profile.class_assignments && profile.class_assignments.length > 0 ? (
              <List>
                {profile.class_assignments.map((assignment, index) => (
                  <ListItem key={assignment.id || index}>
                    <ListItemIcon>
                      <SubjectIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${assignment.subject_name} - ${assignment.class_name}`}
                      secondary={`${assignment.subject_code} • ${assignment.periods_per_week} periods/week • ${assignment.is_compulsory ? 'Compulsory' : 'Optional'}`}
                    />
                    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                      {assignment.credits && (
                        <Chip label={`${assignment.credits} credits`} size="small" variant="outlined" />
                      )}
                      {assignment.syllabus_completion !== undefined && (
                        <Chip
                          label={`${assignment.syllabus_completion}% complete`}
                          size="small"
                          color={assignment.syllabus_completion >= 75 ? 'success' : assignment.syllabus_completion >= 50 ? 'warning' : 'error'}
                        />
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No class assignments found.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TeacherProfileTab;
