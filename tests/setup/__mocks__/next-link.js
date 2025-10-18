import { forwardRef } from 'react';

const NextLink = forwardRef(({ children, href, ...props }, ref) => {
  return (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  );
});

NextLink.displayName = 'NextLink';

module.exports = NextLink;