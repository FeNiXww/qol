import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/a3fa26d38_Untitleddesign.png';

export default function QolLogo({ size = 64, className = '', blend = false }) {
  return (
    <img
      src={LOGO_URL}
      alt="QOL"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size, mixBlendMode: blend ? 'multiply' : undefined }}
    />
  );
}