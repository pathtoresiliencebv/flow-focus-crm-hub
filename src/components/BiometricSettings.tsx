import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fingerprint, Shield, Smartphone, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const BiometricSettings: React.FC = () => {
  const {
    capabilities,
    isEnabled,
    isInitialized,
    setBiometricEnabled,
    authenticateWithBiometric,
    quickAuth,
    isAvailable,
    supportedTypes,
  } = useBiometricAuth();

  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [lockTimeout, setLockTimeout] = useState('15'); // minutes

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      // Test biometric before enabling
      const result = await authenticateWithBiometric('Activeer biometrische authenticatie');
      if (result.success) {
        await setBiometricEnabled(true);
      } else {
        toast({
          title: "Activatie mislukt",
          description: "Biometrische authenticatie kon niet worden geactiveerd.",
          variant: "destructive",
        });
      }
    } else {
      await setBiometricEnabled(false);
    }
  };

  const handleTestBiometric = async () => {
    setTesting(true);
    try {
      const success = await quickAuth('test je biometrische authenticatie');
      if (success) {
        toast({
          title: "Test succesvol",
          description: "Biometrische authenticatie werkt correct.",
        });
      }
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setTesting(false);
    }
  };

  const getBiometricIcon = () => {
    if (supportedTypes.includes('face')) {
      return <Shield className="h-5 w-5" />;
    }
    if (supportedTypes.includes('fingerprint')) {
      return <Fingerprint className="h-5 w-5" />;
    }
    return <Lock className="h-5 w-5" />;
  };

  const getBiometricTypeDisplay = () => {
    if (supportedTypes.includes('face') && supportedTypes.includes('fingerprint')) {
      return 'Face ID & Vingerafdruk';
    }
    if (supportedTypes.includes('face')) {
      return 'Face ID';
    }
    if (supportedTypes.includes('fingerprint')) {
      return 'Vingerafdruk';
    }
    return 'Biometrisch';
  };

  const getCapabilityBadge = () => {
    if (!isInitialized) {
      return <Badge variant="secondary">Laden...</Badge>;
    }
    
    if (!capabilities.isAvailable) {
      return <Badge variant="destructive">Niet beschikbaar</Badge>;
    }
    
    if (!capabilities.isEnrolled) {
      return <Badge variant="secondary">Niet ingeschreven</Badge>;
    }
    
    if (!capabilities.deviceSecure) {
      return <Badge variant="destructive">Apparaat niet beveiligd</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Beschikbaar</Badge>;
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Biometrische instellingen laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getBiometricIcon()}
            Biometrische Beveiliging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Beschikbaarheid</h4>
              <p className="text-sm text-muted-foreground">
                {capabilities.isAvailable 
                  ? `${getBiometricTypeDisplay()} is beschikbaar op dit apparaat`
                  : "Biometrische authenticatie is niet beschikbaar"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getCapabilityBadge()}
            </div>
          </div>

          {!capabilities.isAvailable && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Biometrische authenticatie is alleen beschikbaar op apparaten met biometrische sensors.
                Zorg ervoor dat je apparaat ondersteunde biometrische gegevens heeft geregistreerd.
              </AlertDescription>
            </Alert>
          )}

          {capabilities.isAvailable && !capabilities.isEnrolled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Geen biometrische gegevens gevonden. Voeg vingerafdrukken of Face ID toe in je apparaatinstellingen.
              </AlertDescription>
            </Alert>
          )}

          {capabilities.isAvailable && !capabilities.deviceSecure && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Je apparaat is niet beveiligd met een PIN, patroon of wachtwoord. 
                Stel eerst een beveiligingsmethode in voordat je biometrische authenticatie kunt gebruiken.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {capabilities.isAvailable && capabilities.isEnrolled && capabilities.deviceSecure && (
        <Card>
          <CardHeader>
            <CardTitle>Authenticatie Instellingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Biometrische authenticatie</h4>
                <p className="text-sm text-muted-foreground">
                  Gebruik {getBiometricTypeDisplay().toLowerCase()} om in te loggen en gevoelige acties te beveiligen
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
              />
            </div>

            {isEnabled && (
              <>
                <hr />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Automatische vergrendeling</h4>
                      <p className="text-sm text-muted-foreground">
                        Vergrendel de app na een periode van inactiviteit
                      </p>
                    </div>
                    <Select value={lockTimeout} onValueChange={setLockTimeout}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minuten</SelectItem>
                        <SelectItem value="15">15 minuten</SelectItem>
                        <SelectItem value="30">30 minuten</SelectItem>
                        <SelectItem value="60">1 uur</SelectItem>
                        <SelectItem value="0">Uitgeschakeld</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTestBiometric}
                      disabled={testing}
                      className="flex items-center gap-2"
                    >
                      {getBiometricIcon()}
                      {testing ? "Testen..." : "Test authenticatie"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {isEnabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Biometrische authenticatie is actief. Je kunt nu inloggen met {getBiometricTypeDisplay().toLowerCase()} 
                  en gevoelige acties worden automatisch beveiligd.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Beveiligde Acties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Deze acties vereisen biometrische bevestiging:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Belangrijke instellingen wijzigen</li>
              <li>• Facturen ondertekenen of goedkeuren</li>
              <li>• Gevoelige klant- of projectgegevens bekijken</li>
              <li>• Project status wijzigen naar "Afgerond"</li>
              <li>• Grote betalingen verwerken</li>
            </ul>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Biometrische gegevens worden veilig opgeslagen op je apparaat en nooit gedeeld met onze servers. 
              Je kunt biometrische authenticatie op elk moment uitschakelen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};