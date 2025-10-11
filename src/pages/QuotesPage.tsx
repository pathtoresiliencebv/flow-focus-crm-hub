import { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Quotes } from "@/components/Quotes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function QuotesPage() {
  const { setTitle, setActions } = usePageHeader();
  const navigate = useNavigate();

  // ✅ FIXED: Wrap in useCallback for stable reference
  const handleNewQuote = useCallback(() => {
    console.log('📝 Nieuwe Offerte button clicked!');
    navigate('/quotes/new');
  }, [navigate]);

  // 🔥 Memoize JSX to prevent infinite re-renders
  const headerActions = useMemo(() => (
    <Button 
      size="sm" 
      className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
      onClick={handleNewQuote}
    >
      <Plus className="h-4 w-4 mr-2" />
      Nieuwe Offerte
    </Button>
  ), [handleNewQuote]);

  useEffect(() => {
    console.log('📝 QuotesPage: Setting up header');
    setTitle("Offertes");
    setActions(headerActions);
    return () => {
      console.log('📝 QuotesPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
    // 🔥 CRITICAL: setTitle and setActions are STABLE (useCallback with [])
    // Including them in deps causes INFINITE LOOP when context updates!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Don't include headerActions - it's memoized and causes loops

  return <Quotes />;
}

