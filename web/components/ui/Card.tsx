import {ReactNode} from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({children, className = "", hover = false}: CardProps) => {
  return (
    <div
      className={`bg-card text-card-foreground border border-card-border rounded-lg shadow-card ${
        hover ? "hover:shadow-card-hover transition-shadow" : ""
      } ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({children, className = ""}: CardHeaderProps) => {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({children, className = ""}: CardContentProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({children, className = ""}: CardFooterProps) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

