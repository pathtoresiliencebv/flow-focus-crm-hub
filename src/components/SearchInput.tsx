
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

export const SearchInput = () => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Zoeken..."
        className="w-64 pl-8 bg-gray-50"
      />
    </div>
  );
};
