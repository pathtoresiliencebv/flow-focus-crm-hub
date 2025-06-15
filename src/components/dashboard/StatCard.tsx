
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideProps } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType<LucideProps>;
  iconColorClass: string;
  children: React.ReactNode;
}

export const StatCard = ({ title, value, icon: Icon, iconColorClass, children }: StatCardProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
        {children}
      </CardContent>
    </Card>
  );
};
