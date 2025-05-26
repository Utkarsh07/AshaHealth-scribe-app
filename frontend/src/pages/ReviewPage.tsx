import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Backdrop,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { config } from '../config.ts';

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence_score: number;
  source_segments?: Array<{
    section: string;
    text: string;
    start_time: number;
    end_time: number;
  }>;
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState<SOAPNote | null>(null);

  useEffect(() => {
    const transcription = localStorage.getItem('transcription');
    if (!transcription) {
      navigate('/');
      return;
    }

    generateSOAPNote(transcription);
  }, [navigate]);

  const generateSOAPNote = async (transcription: string) => {
    try {
      const response = await axios.post(`${config.apiUrl}${config.endpoints.generateSoap}`, {
        text: transcription,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
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
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Review SOAP Note
      </Typography>

      <Paper sx={{ p: 4, mt: 4 }}>
        {editedNote && (
          <>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Subjective</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  value={editedNote.subjective}
                  onChange={(e) => handleSectionEdit('subjective', e.target.value)}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Objective</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  value={editedNote.objective}
                  onChange={(e) => handleSectionEdit('objective', e.target.value)}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Assessment</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  value={editedNote.assessment}
                  onChange={(e) => handleSectionEdit('assessment', e.target.value)}
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Plan</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  value={editedNote.plan}
                  onChange={(e) => handleSectionEdit('plan', e.target.value)}
                />
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={handleSave}>
                Save Changes
              </Button>
              <Button variant="outlined" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ReviewPage; 