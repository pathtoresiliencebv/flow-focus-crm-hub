

import { AuthUI } from "@/components/ui/auth-ui";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const LoginScreen = () => {
  const { login, signUp, isLoading } = useAuth();

  const handleAuth = async (email: string, password: string, name?: string, language?: string) => {
    if (!email || !password) {
      toast({
        title: "Fout",
        description: "Vul alle velden in.",
        variant: "destructive"
      });
      return;
    }

    if (name) {
      await signUp(email, password, name);
    } else {
      await login(email, password, language);
    }
  };

  return (
    <AuthUI 
      onLogin={handleAuth}
      isLoading={isLoading}
      quote={{
        text: "SMANS CRM helpt ons om onze projecten efficiënter te beheren en onze klanten beter te bedienen.",
        author: "SMANS Team"
      }}
    />
  );
};

export default LoginScreen;
