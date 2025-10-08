import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import Email from "./Email";

export default function EmailPage() {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle("E-mail");
    setActions(null);
    return () => {
      setTitle("");
      setActions(null);
    };
  }, []);

  return <Email />;
}

