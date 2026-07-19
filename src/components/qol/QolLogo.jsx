import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/561895cb0_Qollogo.png';

export default function QolLogo({ size = 64, className = '' }) {
  return (
    <img
      src={LOGO_URL}
      alt="QOL"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}