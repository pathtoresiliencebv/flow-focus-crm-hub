
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface QuotesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const QuotesSearch: React.FC<QuotesSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Zoek offertes..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};
