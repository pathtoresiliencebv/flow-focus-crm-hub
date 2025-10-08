import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Calendar, MapPin, Clock, User, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * Public Planning Confirmation Page
 * 
 * URL: /confirm/:planningId
 * 
 * Allows customers to confirm or reschedule their appointment
 * No authentication required - accessed via email link
 */

interface PlanningData {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  customer_id: string;
  project_id: string | null;
  assigned_user: {
    full_name: string;
    email: string;
  } | null;
  customer: {
    full_name: string;
    email: string;
  } | null;
}

export default function PlanningConfirmation() {
  const { planningId } = useParams<{ planningId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState<PlanningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (planningId) {
      fetchPlanning();
    }
  }, [planningId]);

  const fetchPlanning = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('planning_items')
        .select(`
          *,
          assigned_user:profiles!planning_items_assigned_user_id_fkey(full_name, email),
          customer:customers!planning_items_customer_id_fkey(full_name, email)
        `)
        .eq('id', planningId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Planning niet gevonden');
      }

      setPlanning(data);
      
      // Check if already confirmed
      if (data.status === 'Bevestigd') {
        setConfirmed(true);
      }

    } catch (err: any) {
      console.error('Error fetching planning:', err);
      setError(err.message || 'Kon afspraak niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!planning) return;

    try {
      setConfirming(true);

      // Update planning status
      const { error: updateError } = await supabase
        .from('planning_items')
        .update({ 
          status: 'Bevestigd',
          updated_at: new Date().toISOString()
        })
        .eq('id', planning.id);

      if (updateError) throw updateError;

      // Create confirmation notification record
      if (planning.customer_id) {
        await supabase
          .from('customer_notifications')
          .insert({
            customer_id: planning.customer_id,
            planning_id: planning.id,
            project_id: planning.project_id,
            notification_type: 'confirmation',
            channel: 'web',
            message: 'Klant heeft afspraak bevestigd via web',
            sent_at: new Date().toISOString(),
            status: 'delivered',
            recipient_name: planning.customer?.full_name,
            recipient_email: planning.customer?.email,
            metadata: {
              confirmed_at: new Date().toISOString(),
              confirmation_method: 'web_link'
            }
          });
      }

      setConfirmed(true);
      
      toast({
        title: "✅ Afspraak bevestigd!",
        description: "Uw afspraak is succesvol bevestigd. U ontvangt een bevestigingsmail.",
      });

    } catch (err: any) {
      console.error('Error confirming planning:', err);
      toast({
        title: "Fout",
        description: "Kon afspraak niet bevestigen. Probeer het opnieuw of bel ons.",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleReschedule = () => {
    toast({
      title: "Neem contact op",
      description: "Bel ons op +31 (0)20 123 4567 om uw afspraak te verzetten.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-lg text-muted-foreground">Afspraak laden...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !planning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Afspraak niet gevonden</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Deze afspraak bestaat niet of is verlopen.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Terug naar Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(`${planning.start_date}T${planning.start_time}`);
  const formattedDate = startDate.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = startDate.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-20 h-20 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-3xl font-bold text-green-900">
              Afspraak Bevestigd! ✅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 border-2 border-green-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Uw Afspraak</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="font-medium">Datum:</span> {formattedDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="font-medium">Tijd:</span> {formattedTime}
                  </div>
                </div>

                {planning.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium">Locatie:</span> {planning.location}
                    </div>
                  </div>
                )}

                {planning.assigned_user && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium">Monteur:</span> {planning.assigned_user.full_name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-2">Wat nu?</h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li>✅ U ontvangt een bevestigingsmail</li>
                <li>✅ De afspraak staat in uw agenda (iCal)</li>
                <li>✅ U krijgt een herinnering 24 uur van tevoren</li>
                <li>✅ Onze monteur komt op de afgesproken tijd</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Vragen of wijzigingen? Neem contact op:
              </p>
              <p className="font-semibold">
                📞 +31 (0)20 123 4567<br/>
                📧 planning@smansbv.nl
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Bevestig Uw Afspraak</CardTitle>
          <p className="text-muted-foreground mt-2">
            Controleer de details en bevestig uw afspraak
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Planning Details */}
          <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">{planning.title}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{formattedDate}</div>
                  <div className="text-sm text-gray-600">Datum van afspraak</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{formattedTime}</div>
                  <div className="text-sm text-gray-600">Verwachte aankomsttijd</div>
                </div>
              </div>

              {planning.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">{planning.location}</div>
                    <div className="text-sm text-gray-600">Locatie</div>
                  </div>
                </div>
              )}

              {planning.assigned_user && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">{planning.assigned_user.full_name}</div>
                    <div className="text-sm text-gray-600">Uw monteur</div>
                  </div>
                </div>
              )}

              {planning.description && (
                <div className="pt-4 border-t">
                  <div className="font-medium text-gray-900 mb-2">Werkzaamheden:</div>
                  <div className="text-gray-700">{planning.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">📌 Belangrijk</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Zorg dat iemand thuis is op de afgesproken tijd</li>
              <li>• Maak de werkplek vrij toegankelijk</li>
              <li>• Zet huisdieren indien mogelijk in een andere ruimte</li>
              <li>• U ontvangt 24 uur van tevoren nog een herinnering</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Bevestigen...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Bevestig Afspraak
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleReschedule}
              className="flex-1 h-14 text-lg font-semibold"
            >
              Verzetten
            </Button>
          </div>

          {/* Contact Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Vragen over uw afspraak?
            </p>
            <p className="font-semibold text-gray-900">
              📞 +31 (0)20 123 4567<br/>
              📧 planning@smansbv.nl
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

