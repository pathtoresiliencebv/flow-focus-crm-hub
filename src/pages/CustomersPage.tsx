import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Customers } from "@/components/Customers";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export default function CustomersPage() {
  const { setTitle, setActions } = usePageHeader();
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // ✅ FIXED: Wrap in useCallback for stable references
  const handleNewCustomer = useCallback(() => {
    console.log('👤 Nieuwe Klant button clicked!');
    setShowNewCustomerDialog(true);
  }, []);

  const handleSearch = useCallback(() => {
    console.log('🔍 Zoeken button clicked!');
    setShowSearchBar(true);
  }, []);

  // 🔥 Memoize JSX to prevent infinite re-renders
  const headerActions = useMemo(() => (
    <>
      <Button variant="outline" size="sm" onClick={handleSearch}>
        <Search className="h-4 w-4 mr-2" />
        Zoeken
      </Button>
      <Button 
        size="sm" 
        className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
        onClick={handleNewCustomer}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nieuwe Klant
      </Button>
    </>
  ), [handleNewCustomer, handleSearch]);

  useEffect(() => {
    console.log('📝 CustomersPage: Setting up header');
    setTitle("Klanten");
    setActions(headerActions);
    return () => {
      console.log('📝 CustomersPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
    // 🔥 CRITICAL: setTitle and setActions are STABLE (useCallback with [])
    // Including them in deps causes INFINITE LOOP when context updates!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Don't include headerActions - it's memoized and causes loops

  return (
    <Customers 
      showNewCustomerDialog={showNewCustomerDialog}
      onCloseNewCustomerDialog={() => setShowNewCustomerDialog(false)}
      showSearchBar={showSearchBar}
      onSearchToggle={setShowSearchBar}
    />
  );
}

