import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  href?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  href,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-serif transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    primary: "bg-[#00B445] text-white hover:bg-[#006F2A] shadow-lg shadow-[#00B445]/20",
    secondary: "bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/10",
    outline: "border border-white/30 text-white hover:border-white hover:bg-white hover:text-black",
    ghost: "text-white/70 hover:text-white hover:bg-white/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-[0.85rem] tracking-wider uppercase",
    md: "px-8 py-4 text-[1.1rem] tracking-wide",
    lg: "px-10 py-5 text-[1.3rem] tracking-wider",
  };

  const combinedStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedStyles}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
};

export default Button;
