import React from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  CardMedia,
  CardContent,
  Typography, 
  Button, 
  Box, 
  Rating 
} from '@mui/material';

const ProductCard = ({ product, onReview, isReviewed }) => {
  if (!product) return null;

  // Handle image URL - support both string and object formats
  const imageUrl = Array.isArray(product.images) && product.images.length > 0 
    ? (typeof product.images[0] === 'string' 
        ? product.images[0] 
        : product.images[0]?.url || '/placeholder.jpg')
    : '/placeholder.jpg';

  return (
    <Card className="h-full flex flex-col">
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={product.name}
        className="object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder.jpg';
        }}
      />
      
      <CardContent className="flex-grow flex flex-col">
        <Typography variant="h6" className="mb-2">
          {product.name}
        </Typography>

        {isReviewed ? (
          <Box className="mt-auto space-y-2">
            <Box className="flex items-center gap-2">
              <Rating 
                value={product.userReview?.rating || 0} 
                readOnly 
                size="small"
                precision={0.5}
              />
              <Typography variant="caption" color="text.secondary">
                Your rating
              </Typography>
            </Box>
            {product.userReview?.comment && (
              <Typography variant="body2" color="text.secondary" noWrap>
                "{product.userReview.comment}"
              </Typography>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={() => onReview(product)}
              fullWidth
            >
              Edit Review
            </Button>
          </Box>
        ) : (
          <Box className="mt-auto">
            <Button
              variant="contained"
              size="small"
              onClick={() => onReview(product)}
              fullWidth
            >
              Write Review
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string
      })
    ])),
    userReview: PropTypes.shape({
      rating: PropTypes.number,
      comment: PropTypes.string
    })
  }).isRequired,
  onReview: PropTypes.func.isRequired,
  isReviewed: PropTypes.bool.isRequired
};

export default ProductCard;