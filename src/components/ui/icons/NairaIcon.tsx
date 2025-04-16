import React from 'react';

interface NairaIconProps {
  className?: string;
}

const NairaIcon: React.FC<NairaIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
    >
      <path d="M12 16h8l12 16h4V16h8v16h8v8h-8v14h-8V40h-4l-12 14h-8V40H4v-8h8V16zM28 32l-8-10v10h8zm16 0V22l-8 10h8z" />
    </svg>
  );
};

export default NairaIcon;
