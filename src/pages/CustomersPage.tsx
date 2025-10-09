import { useEffect, useState } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Customers } from "@/components/Customers";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export default function CustomersPage() {
  const { setTitle, setActions } = usePageHeader();
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const handleNewCustomer = () => {
    setShowNewCustomerDialog(true);
  };

  const handleSearch = () => {
    setShowSearchBar(true);
  };

  useEffect(() => {
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
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions]);

  return (
    <Customers 
      showNewCustomerDialog={showNewCustomerDialog}
      onCloseNewCustomerDialog={() => setShowNewCustomerDialog(false)}
      showSearchBar={showSearchBar}
      onSearchToggle={setShowSearchBar}
    />
  );
}

