import React from 'react';
import OptimizedImage from './OptimizedImage';

/**
 * ProductImage Component
 * Forwarding wrapper around OptimizedImage for complete backwards compatibility
 */
const ProductImage = (props) => {
  return <OptimizedImage {...props} componentName={props.componentName || 'ProductImage'} />;
};

export { OptimizedImage };
export default ProductImage;
