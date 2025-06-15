
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

interface ReportsHeaderProps {
  period: string;
  onPeriodChange: (value: string) => void;
  onDownload: () => void;
}

export const ReportsHeader = ({ period, onPeriodChange, onDownload }: ReportsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Rapportages</h2>
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Deze week</SelectItem>
            <SelectItem value="month">Deze maand</SelectItem>
            <SelectItem value="quarter">Dit kwartaal</SelectItem>
            <SelectItem value="year">Dit jaar</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Exporteren
        </Button>
      </div>
    </div>
  );
};
