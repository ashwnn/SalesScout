import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {year} SalesScout. All rights reserved.</p>
        <p>
          Created by Ashwin Charathsandran for CPSC 2650
        </p>
        <p>
          Licensed under{' '}
          <a 
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--brand-red)', textDecoration: 'underline' }}
          >
            CC BY-NC-SA 4.0
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;