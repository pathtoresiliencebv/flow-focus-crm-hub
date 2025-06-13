
import { useState, useRef } from "react";
import { X, Send, Paperclip, Mic, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

interface ChatWindowProps {
  onClose: () => void;
}

const mockUsers: ChatUser[] = [
  { id: "1", name: "Jan Kowalski", isOnline: true, role: "monteur", language: "pl" },
  { id: "2", name: "Pavel Novak", isOnline: false, role: "monteur", language: "cs" },
  { id: "3", name: "Admin User", isOnline: true, role: "admin", language: "nl" },
];

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "1",
    content: "Dzień dobry, projekt jest gotowy do przeglądu",
    translatedContent: "Goedemorgen, het project is klaar voor beoordeling",
    timestamp: new Date(Date.now() - 30000),
    type: "text"
  },
  {
    id: "2",
    senderId: "3",
    content: "Bedankt voor de update! Kunnen we de foto's bekijken?",
    translatedContent: "Dziękuję za aktualizację! Czy możemy zobaczyć zdjęcia?",
    timestamp: new Date(Date.now() - 15000),
    type: "text"
  }
];

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [selectedUser, setSelectedUser] = useState<string | null>("1");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedUserData = mockUsers.find(u => u.id === selectedUser);
  const currentUser = mockUsers.find(u => u.role === "admin"); // Current logged in user

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || "3",
      content: newMessage,
      timestamp: new Date(),
      type: "text"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-96 h-[500px] shadow-xl">
      {/* Header */}
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Monteur Chat</h3>
          {selectedUserData && (
            <Badge variant={selectedUserData.isOnline ? "default" : "secondary"}>
              {selectedUserData.isOnline ? "Online" : "Offline"}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex h-[420px]">
        {/* User List */}
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            <div className="p-2">
              {mockUsers
                .filter(user => user.role === "monteur")
                .map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer rounded-lg hover:bg-gray-50 ${
                      selectedUser === user.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedUser(user.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            user.isOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{user.language}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwnMessage={message.senderId === currentUser?.id}
                      sender={mockUsers.find(u => u.id === message.senderId)}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2 mb-2">
                  <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isRecording ? "text-red-500" : ""}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type je bericht..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecteer een monteur om te chatten
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
