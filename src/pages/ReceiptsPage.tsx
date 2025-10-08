import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Receipts } from "@/components/Receipts";

export default function ReceiptsPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("Bonnetjes");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <Receipts />;
}

