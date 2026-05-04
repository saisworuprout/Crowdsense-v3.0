import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'cyan' | 'black' | 'white';
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export default function Button({ variant = 'primary', children, className = '', icon, ...props }: ButtonProps) {
  const baseClasses = "text-lg md:text-xl font-black uppercase px-6 md:px-8 py-4 border-4 border-cs-black shadow-[8px_8px_0px_#000000] cursor-pointer inline-flex items-center justify-center gap-2 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000000] transition-all focus:outline-none";
  
  const variants = {
    primary: "bg-[#f90680] text-white",
    secondary: "bg-white text-black hover:bg-[#FFD700]",
    yellow: "bg-[#FFD700] text-black",
    cyan: "bg-[#00FFFF] text-black",
    black: "bg-black text-white",
    white: "bg-white text-black hover:bg-[#00FFFF]"
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <button className={`${baseClasses} ${variantClass} ${className}`} {...props}>
      <span>{children}</span>
      {icon && <span className="material-symbols-outlined">{icon}</span>}
    </button>
  );
}
