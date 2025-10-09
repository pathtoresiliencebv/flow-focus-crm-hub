import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Quotes } from "@/components/Quotes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function QuotesPage() {
  const { setTitle, setActions } = usePageHeader();
  const navigate = useNavigate();

  const handleNewQuote = () => {
    navigate('/quotes/new');
  };

  useEffect(() => {
    setTitle("Offertes");
    setActions(
      <Button 
        size="sm" 
        className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
        onClick={handleNewQuote}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nieuwe Offerte
      </Button>
    );
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [navigate, setTitle, setActions]);

  return <Quotes />;
}

