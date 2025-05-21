
import React, { useState } from 'react';
import { CrmSidebar } from "@/components/CrmSidebar";
import { CompanySettingsForm } from "@/components/CompanySettingsForm";
import { InvoiceSettingsForm } from "@/components/InvoiceSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { SearchInput } from "@/components/SearchInput";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [activeSettingsTab, setActiveSettingsTab] = useState("company");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Instellingen</h1>
            <div className="flex items-center space-x-4">
              <SearchInput />
              <NotificationsMenu />
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Tabs
              defaultValue="company"
              value={activeSettingsTab}
              onValueChange={setActiveSettingsTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="company">Bedrijfsgegevens</TabsTrigger>
                <TabsTrigger value="invoice">Factuurgegevens</TabsTrigger>
                <TabsTrigger value="appearance">Weergave</TabsTrigger>
              </TabsList>
              <TabsContent value="company">
                <CompanySettingsForm />
              </TabsContent>
              <TabsContent value="invoice">
                <InvoiceSettingsForm />
              </TabsContent>
              <TabsContent value="appearance">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-lg font-medium mb-6">Weergave-instellingen</h2>
                  <p className="text-gray-500">Weergave-instellingen komen binnenkort beschikbaar.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
