import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {year} SalesScout. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;