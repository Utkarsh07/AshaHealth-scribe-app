import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Backdrop,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import { config } from '../config.ts';
import SOAPSection from '../components/SOAPSection.tsx';

interface SourceSegment {
  text: string;
  source_text: string;
  start_index: number;
  end_index: number;
  section: string;
}

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence_score: number;
  source_segments: SourceSegment[];
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState<SOAPNote | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState<string>('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const transcription = localStorage.getItem('transcription');
    if (!transcription) {
      navigate('/');
      return;
    }
    setOriginalTranscript(transcription);
    generateSOAPNote(transcription);
    // eslint-disable-next-line
  }, [navigate]);

  const generateSOAPNote = async (transcription: string) => {
    try {
      const response = await axios.post(`${config.apiUrl}${config.endpoints.generateSoap}`, {
        text: transcription,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data) {
        setSoapNote(response.data);
        setEditedNote(response.data);
      } else {
        throw new Error('Invalid response format');
      }
      setIsLoading(false);
    } catch (err) {
      console.error('SOAP note generation error:', err);
      setError('Failed to generate SOAP note. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSectionEdit = (section: keyof SOAPNote, value: string) => {
    if (editedNote) {
      setEditedNote({
        ...editedNote,
        [section]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!editedNote) return;
    try {
      // Save logic here
      console.log('Saving edited note:', editedNote);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} thickness={5} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Generating SOAP note...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Hang tight! This usually takes less than a minute.
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Review SOAP Note
      </Typography>
      <Paper elevation={0} sx={{ p: 5, mt: 4 }}>
        {editedNote && (
          <Stack spacing={3}>
            <SOAPSection
              title="Subjective"
              content={editedNote.subjective}
              sourceSegments={editedNote.source_segments}
              originalTranscript={originalTranscript}
            />
            <SOAPSection
              title="Objective"
              content={editedNote.objective}
              sourceSegments={editedNote.source_segments}
              originalTranscript={originalTranscript}
            />
            <SOAPSection
              title="Assessment"
              content={editedNote.assessment}
              sourceSegments={editedNote.source_segments}
              originalTranscript={originalTranscript}
            />
            <SOAPSection
              title="Plan"
              content={editedNote.plan}
              sourceSegments={editedNote.source_segments}
              originalTranscript={originalTranscript}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" color="primary" size="large" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default ReviewPage; 