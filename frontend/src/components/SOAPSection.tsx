import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Paper,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface SourceSegment {
  text: string;
  source_text: string;
  start_index: number;
  end_index: number;
  section: string;
}

interface SOAPSectionProps {
  title: string;
  content: string;
  sourceSegments: SourceSegment[];
  originalTranscript: string;
}

const SOAPSection: React.FC<SOAPSectionProps> = ({
  title,
  content,
  sourceSegments,
  originalTranscript,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<SourceSegment | null>(null);

  // Split content into lines and map them to source segments
  const lines = content.split('\n').filter(line => line.trim());
  
  const renderLine = (line: string, index: number) => {
    // Remove bullet and whitespace for matching
    const cleanLine = line.replace(/^[*-•]\s*/, '').trim();
    const matchingSegment = sourceSegments.find(segment => 
      segment.section === title.toLowerCase() && 
      segment.text === cleanLine
    );

    if (matchingSegment) {
      return (
        <Tooltip
          key={index}
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Source from transcript:</Typography>
              <Typography variant="body2">{matchingSegment.source_text}</Typography>
            </Box>
          }
          arrow
          placement="right"
          onOpen={() => setHoveredSegment(matchingSegment)}
          onClose={() => setHoveredSegment(null)}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              cursor: 'pointer',
              backgroundColor: hoveredSegment === matchingSegment ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              borderRadius: '4px',
              padding: '2px 4px',
              margin: '2px 0',
              transition: 'background-color 0.2s',
            }}
          >
            {line}
          </Box>
        </Tooltip>
      );
    }

    return <Box key={index} sx={{ my: 0.5 }}>{line}</Box>;
  };

  return (
    <Paper elevation={0} sx={{ p: 3, background: '#f7f9fb', mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ pl: 2 }}>
        {lines.map((line, index) => renderLine(line, index))}
      </Box>
    </Paper>
  );
};

export default SOAPSection; 