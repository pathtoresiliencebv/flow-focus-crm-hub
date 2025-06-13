
import React from 'react';
import { AuthUI } from "@/components/ui/auth-ui";
import { toast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const handleLogin = async (email: string, password: string, name?: string) => {
    // Simple validation
    if (!email || !password) {
      toast({
        title: "Fout",
        description: "Vul alle velden in.",
        variant: "destructive"
      });
      return;
    }

    // For demo purposes, accept any email/password combination
    setTimeout(() => {
      onLogin(email, password);
    }, 1000);
  };

  return (
    <AuthUI 
      onLogin={handleLogin}
      quote={{
        text: "SMANS CRM helpt ons om onze projecten efficiënter te beheren en onze klanten beter te bedienen.",
        author: "SMANS Team"
      }}
    />
  );
};

export default LoginScreen;
