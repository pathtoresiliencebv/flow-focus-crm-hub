
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface UpcomingAppointmentItem {
  id: string;
  date: string;
  time: string;
  employee: string;
  project: string;
  location: string;
  status: "Gepland" | "Bevestigd" | "Afgerond" | "Geannuleerd";
}

interface UpcomingAppointmentsProps {
  planningItems: UpcomingAppointmentItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Gepland": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Bevestigd": return "bg-green-100 text-green-800 border-green-200";
    case "Afgerond": return "bg-gray-100 text-gray-800 border-gray-200";
    case "Geannuleerd": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const UpcomingAppointments = ({ planningItems }: UpcomingAppointmentsProps) => {
  return (
    <div className="xl:hidden">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            Komende Afspraken
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            {planningItems.length} afspraak/afspraken de komende week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planningItems.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Geen afspraken gepland</p>
            </div>
          ) : (
            <div className="space-y-3">
              {planningItems.slice(0, 4).map((item) => (
                <div key={item.id} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      {format(new Date(item.date), 'dd MMM', { locale: nl })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 mb-1">{item.project}</div>
                      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span>{item.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-green-500" />
                          <span>{item.employee}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="break-words text-xs">{item.location}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
