import { useEffect, useState, useCallback } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Customers } from "@/components/Customers";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function CustomersPage() {
  const { setTitle, setActions } = usePageHeader();
  const { t } = useI18n();
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

  useEffect(() => {
    console.log('📝 CustomersPage: Setting up header');
    setTitle("Klanten");
    setActions(
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
    );
    return () => {
      console.log('📝 CustomersPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions, handleNewCustomer, handleSearch]);

  return (
    <Customers 
      showNewCustomerDialog={showNewCustomerDialog}
      onCloseNewCustomerDialog={() => setShowNewCustomerDialog(false)}
      showSearchBar={showSearchBar}
      onSearchToggle={setShowSearchBar}
    />
  );
}

