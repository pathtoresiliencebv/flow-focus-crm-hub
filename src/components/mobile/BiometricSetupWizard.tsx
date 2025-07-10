import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { 
  Fingerprint, 
  Scan, 
  Shield, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Settings
} from "lucide-react";

interface BiometricSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const BiometricSetupWizard: React.FC<BiometricSetupWizardProps> = ({
  onComplete,
  onSkip
}) => {
  const {
    capabilities,
    isEnabled,
    setBiometricEnabled,
    authenticateWithBiometric,
    isInitialized
  } = useBiometricAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const steps = [
    {
      title: "Welcome to Biometric Security",
      description: "Enhance your account security with biometric authentication",
      icon: <Shield className="h-12 w-12 text-primary" />
    },
    {
      title: "Check Device Capabilities", 
      description: "Let's verify your device supports biometric authentication",
      icon: <Scan className="h-12 w-12 text-primary" />
    },
    {
      title: "Test Biometric Authentication",
      description: "Test your biometric authentication to ensure it works correctly",
      icon: <Fingerprint className="h-12 w-12 text-primary" />
    },
    {
      title: "Setup Complete",
      description: "Your biometric authentication is now configured and ready to use",
      icon: <CheckCircle2 className="h-12 w-12 text-green-500" />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEnableBiometric = async () => {
    setIsSetupInProgress(true);
    try {
      const success = await setBiometricEnabled(true);
      if (success) {
        handleNext();
      }
    } finally {
      setIsSetupInProgress(false);
    }
  };

  const handleTestBiometric = async () => {
    setIsSetupInProgress(true);
    try {
      const result = await authenticateWithBiometric("Test biometric authentication");
      setTestResult({
        success: result.success,
        message: result.success 
          ? "Biometric authentication test successful!" 
          : result.error || "Test failed"
      });
      
      if (result.success) {
        setTimeout(() => {
          handleNext();
        }, 1500);
      }
    } finally {
      setIsSetupInProgress(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[0].icon}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Enhanced Security</h3>
              <p className="text-muted-foreground">
                Biometric authentication provides an additional layer of security 
                for your account, making it faster and more secure to access 
                sensitive information.
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Faster login experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Enhanced security for sensitive operations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No passwords to remember</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[1].icon}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Device Capabilities</h3>
              
              {!isInitialized ? (
                <div className="text-muted-foreground">
                  Checking device capabilities...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">Biometric Available</span>
                      <Badge variant={capabilities.isAvailable ? "default" : "secondary"}>
                        {capabilities.isAvailable ? "Yes" : "No"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">Device Secure</span>
                      <Badge variant={capabilities.deviceSecure ? "default" : "destructive"}>
                        {capabilities.deviceSecure ? "Yes" : "No"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">Biometric Enrolled</span>
                      <Badge variant={capabilities.isEnrolled ? "default" : "secondary"}>
                        {capabilities.isEnrolled ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  {capabilities.supportedTypes.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-sm">Available Types:</span>
                      <div className="flex flex-wrap gap-2">
                        {capabilities.supportedTypes.map(type => (
                          <Badge key={type} variant="outline">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!capabilities.isAvailable && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        Biometric authentication is not available on this device. 
                        You can still use PIN or password authentication.
                      </div>
                    </div>
                  )}

                  {!capabilities.isEnrolled && capabilities.isAvailable && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        Please enroll your biometric data in device settings first.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[2].icon}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Test Authentication</h3>
              <p className="text-muted-foreground">
                Let's test your biometric authentication to make sure everything works correctly.
              </p>
              
              {testResult && (
                <div className={`p-3 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className={`flex items-center gap-2 text-sm ${
                    testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleTestBiometric}
                disabled={isSetupInProgress || !capabilities.isAvailable || !isEnabled}
                className="w-full"
              >
                {isSetupInProgress ? "Testing..." : "Test Biometric"}
              </Button>

              {!isEnabled && (
                <Button 
                  onClick={handleEnableBiometric}
                  disabled={isSetupInProgress || !capabilities.isAvailable}
                  variant="outline"
                  className="w-full"
                >
                  {isSetupInProgress ? "Enabling..." : "Enable Biometric First"}
                </Button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {steps[3].icon}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your biometric authentication is now active and ready to use. 
                You can now use it to quickly and securely access your account.
              </p>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-200">
                  <strong>Next time you log in:</strong> You'll be able to use your biometric 
                  authentication for faster, more secure access.
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Biometric Setup</CardTitle>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        <CardDescription className="mt-3">
          {steps[currentStep].description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStepContent()}
        
        <Separator />
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={currentStep === 0 ? onSkip : handleBack}
            disabled={isSetupInProgress}
          >
            {currentStep === 0 ? (
              "Skip Setup"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            )}
          </Button>
          
          <Button 
            onClick={currentStep === steps.length - 1 ? onComplete : handleNext}
            disabled={
              isSetupInProgress || 
              (currentStep === 1 && !capabilities.isAvailable) ||
              (currentStep === 2 && !testResult?.success)
            }
          >
            {currentStep === steps.length - 1 ? (
              "Complete"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};