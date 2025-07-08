import React from 'react';

export default function VraneSpinner({ size = 96 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      className="vrane-spinner"
    >
      <circle
        cx="48"
        cy="48"
        r="40"
        stroke="#e67e22"
        strokeWidth="8"
        strokeDasharray="62.8 62.8"
        strokeDashoffset="0"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
} 