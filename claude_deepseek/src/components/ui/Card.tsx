interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 ${className}`}>
      {children}
    </div>
  );
}
