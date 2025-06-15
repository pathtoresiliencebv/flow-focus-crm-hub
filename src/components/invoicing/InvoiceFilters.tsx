
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
}

export const InvoiceFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus 
}: InvoiceFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="w-full md:w-1/3">
        <Input 
          placeholder="Zoek op factuurnummer, klant of project..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filterStatus === null ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus(null)}
        >
          Alle
        </Button>
        <Button 
          variant={filterStatus === "Concept" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("Concept")}
        >
          Concepten
        </Button>
        <Button 
          variant={filterStatus === "Verzonden" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("Verzonden")}
        >
          Verzonden
        </Button>
        <Button 
          variant={filterStatus === "Betaald" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("Betaald")}
        >
          Betaald
        </Button>
        <Button 
          variant={filterStatus === "Verlopen" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterStatus("Verlopen")}
        >
          Verlopen
        </Button>
      </div>
    </div>
  );
};
