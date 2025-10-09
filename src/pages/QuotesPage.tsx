import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useI18n } from "@/contexts/I18nContext";
import { Quotes } from "@/components/Quotes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function QuotesPage() {
  const { setTitle, setActions } = usePageHeader();
  const navigate = useNavigate();
  const { t } = useI18n();

  // ✅ FIXED: Wrap in useCallback for stable reference
  const handleNewQuote = useCallback(() => {
    console.log('📝 Nieuwe Offerte button clicked!');
    navigate('/quotes/new');
  }, [navigate]);

  useEffect(() => {
    console.log('📝 QuotesPage: Setting up header');
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
      console.log('📝 QuotesPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions, handleNewQuote]);

  return <Quotes />;
}

