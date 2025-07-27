import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Home, ExternalLink } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuoteRoute, setIsQuoteRoute] = useState(false);

  useEffect(() => {
    const isQuote = location.pathname.startsWith('/quote/');
    setIsQuoteRoute(isQuote);
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      isQuote ? "(Quote route - possible token issue)" : ""
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        {isQuoteRoute ? (
          <>
            <FileText className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Offerte niet gevonden</h1>
            <p className="text-lg text-gray-600 mb-6">
              De opgevraagde offerte bestaat niet of is niet langer beschikbaar.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Controleer of de link correct is of neem contact op met SMANS BV voor een nieuwe link.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = 'https://smanscrm.nl'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Ga naar SMANS Website
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'tel:+31123456789'}
                className="w-full"
              >
                Contact Opnemen
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pagina niet gevonden</h1>
            <p className="text-gray-600 mb-8">
              De pagina die u zoekt bestaat niet of is verplaatst.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Terug naar Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'https://smanscrm.nl'}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                SMANS Website
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
