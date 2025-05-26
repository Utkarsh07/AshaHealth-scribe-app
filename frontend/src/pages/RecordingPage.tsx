import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, CircularProgress, Backdrop } from '@mui/material';
import { AudioRecorder } from 'react-audio-voice-recorder';
import MicIcon from '@mui/icons-material/Mic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { config } from '../config.ts';

const RecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioSubmission(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmission = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      const response = await axios.post(`${config.apiUrl}${config.endpoints.transcribe}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        localStorage.setItem('transcription', response.data.transcription);
        navigate('/review');
      } else {
        throw new Error(response.data.message || 'Transcription failed');
      }
    } catch (err) {
      setError('Failed to process audio. Please try again.');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ mt: 6 }}>
      <Paper elevation={0} sx={{ p: 5, maxWidth: 520, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <MicIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
          Record Medical Consultation
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Click the button below to start recording your conversation. When finished, click stop to process and generate a SOAP note.
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <AudioRecorder
          onRecordingComplete={handleAudioSubmission}
          downloadOnSavePress={false}
          downloadFileExtension="wav"
          showVisualizer
        />
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2, width: '100%' }}
        >
          Back to Home
        </Button>
      </Paper>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isProcessing}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} thickness={5} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Transcribing audio and generating SOAP note...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Hang tight! This usually takes less than a minute.
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default RecordingPage; 