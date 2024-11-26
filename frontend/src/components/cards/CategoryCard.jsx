import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const CardContainer = ({ title, content, className }) => {
  return (
    <Card className={`shadow-lg rounded-lg p-4 ${className}`} sx={{ bgcolor: '#f5f5f5' }}> {/* Light background */}
      <CardContent>
        <Typography variant="h5" className="font-bold mb-2" sx={{ color: '#333333' }}> {/* Dark color for title */}
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#555555' }}> {/* Medium color for content */}
          {content}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CardContainer;
