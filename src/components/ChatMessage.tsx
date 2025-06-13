
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  role: "admin" | "monteur";
  language: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  translatedContent?: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "voice";
  fileUrl?: string;
  fileName?: string;
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: ChatUser;
}

export const ChatMessage = ({ message, isOwnMessage, sender }: ChatMessageProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case "image":
        return (
          <img 
            src={message.fileUrl} 
            alt="Shared image" 
            className="max-w-xs rounded-lg"
          />
        );
      case "file":
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs text-gray-500">Bestand</p>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <Button variant="ghost" size="sm">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-1/3"></div>
              </div>
            </div>
            <span className="text-xs text-gray-500">0:15</span>
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <p className="text-sm">{message.content}</p>
            {message.translatedContent && message.translatedContent !== message.content && (
              <div className="border-t pt-1 mt-2">
                <Badge variant="outline" className="mb-1 text-xs">
                  Vertaald
                </Badge>
                <p className="text-sm text-gray-600 italic">
                  {message.translatedContent}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {!isOwnMessage && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback className="text-xs">
            {sender.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-xs`}>
        {!isOwnMessage && sender && (
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-700">{sender.name}</p>
            <Badge variant="secondary" className="text-xs">
              {sender.language.toUpperCase()}
            </Badge>
          </div>
        )}
        
        <Card className={`${isOwnMessage ? "bg-blue-500 text-white" : "bg-white"} shadow-sm`}>
          <CardContent className="p-3">
            {renderMessageContent()}
          </CardContent>
        </Card>
        
        <p className="text-xs text-gray-500 mt-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
