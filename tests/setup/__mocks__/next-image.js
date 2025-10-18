import { forwardRef } from 'react';

const NextImage = forwardRef(({ src, alt, ...props }, ref) => {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      {...props}
    />
  );
});

NextImage.displayName = 'NextImage';

module.exports = NextImage;