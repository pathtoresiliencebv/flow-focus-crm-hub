import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AppLockScreenProps {
  onUnlock: () => void;
  reason?: string;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  onUnlock,
  reason = "Toegang tot de app"
}) => {
  const {
    capabilities,
    isEnabled: isBiometricEnabled,
    authenticateWithBiometric,
    isAvailable,
    supportedTypes,
  } = useBiometricAuth();

  const { login } = useAuth();
  const { toast } = useToast();

  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

  useEffect(() => {
    // Automatically attempt biometric authentication if available
    if (isAvailable && !showPasswordFallback) {
      handleBiometricAuth();
    }
  }, [isAvailable]);

  const handleBiometricAuth = async () => {
    if (!isAvailable || attemptingBiometric) return;

    setAttemptingBiometric(true);
    try {
      const result = await authenticateWithBiometric(reason);
      
      if (result.success) {
        onUnlock();
      } else if (result.fallbackToPin) {
        setShowPasswordFallback(true);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setShowPasswordFallback(true);
    } finally {
      setAttemptingBiometric(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Gegevens vereist",
        description: "Voer je email en wachtwoord in.",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      await login(email, password);
      onUnlock();
    } catch (error: any) {
      toast({
        title: "Inloggen mislukt",
        description: error.message || "Controleer je inloggegevens en probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (supportedTypes.includes('face')) {
      return <Shield className="h-12 w-12 text-blue-500" />;
    }
    if (supportedTypes.includes('fingerprint')) {
      return <Fingerprint className="h-12 w-12 text-blue-500" />;
    }
    return <Lock className="h-12 w-12 text-blue-500" />;
  };

  const getBiometricText = () => {
    if (supportedTypes.includes('face') && supportedTypes.includes('fingerprint')) {
      return 'Face ID of vingerafdruk';
    }
    if (supportedTypes.includes('face')) {
      return 'Face ID';
    }
    if (supportedTypes.includes('fingerprint')) {
      return 'Vingerafdruk';
    }
    return 'Biometrische authenticatie';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {isAvailable && !showPasswordFallback ? (
              getBiometricIcon()
            ) : (
              <Lock className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isAvailable && !showPasswordFallback ? 'App Vergrendeld' : 'Inloggen Vereist'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {reason}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {isAvailable && !showPasswordFallback ? (
            // Biometric authentication view
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Gebruik je {getBiometricText().toLowerCase()} om verder te gaan
              </p>
              
              <Button
                onClick={handleBiometricAuth}
                disabled={attemptingBiometric}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                {getBiometricIcon()}
                {attemptingBiometric ? 'Authenticeren...' : `Gebruik ${getBiometricText()}`}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowPasswordFallback(true)}
                className="w-full text-sm"
              >
                Gebruik wachtwoord
              </Button>
            </div>
          ) : (
            // Password fallback view
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="je@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Je wachtwoord"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? 'Inloggen...' : 'Inloggen'}
              </Button>

              {isAvailable && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordFallback(false);
                    handleBiometricAuth();
                  }}
                  className="w-full text-sm flex items-center gap-2"
                >
                  {getBiometricIcon()}
                  Terug naar {getBiometricText().toLowerCase()}
                </Button>
              )}
            </form>
          )}

          <div className="text-xs text-center text-muted-foreground mt-4">
            <p>Je gegevens zijn beveiligd met end-to-end encryptie</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};