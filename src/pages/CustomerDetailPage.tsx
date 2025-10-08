import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import CustomerDetail from "@/components/CustomerDetail";
import { useCrmStore } from "@/hooks/useCrmStore";

export default function CustomerDetailPage() {
  const { setTitle, setActions } = usePageHeader();
  const { customerId } = useParams();
  const { customers } = useCrmStore();
  const customer = customers.find(c => c.id === customerId);

  useEffect(() => {
    setTitle(customer?.name || "Klant Details");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [customer]);

  return <CustomerDetail />;
}

