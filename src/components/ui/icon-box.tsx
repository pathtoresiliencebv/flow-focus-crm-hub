import React from "react";
import { Badge } from "./badge";

interface IconBoxProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  count?: number;
}

export function IconBox({ icon, label, active, onClick, count }: IconBoxProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        active 
          ? 'border-[hsl(0,71%,36%)] bg-[hsl(0,71%,36%)]/5' 
          : 'border-gray-200 hover:border-[hsl(0,71%,36%)]'
      }`}
    >
      <div className={`${active ? 'text-[hsl(0,71%,36%)]' : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && (
        <Badge variant="secondary">{count}</Badge>
      )}
    </button>
  );
}

