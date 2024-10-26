import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const askQuestion = async (query) => {
  const url = 'https://api.on-demand.io/chat/v1/sessions/API_KEY/query';
  const data = {
    endpointId: "predefined-openai-gpt4o",
    query: query,
    pluginIds: ['plugin-1713962163'],
    responseMode: "sync"
  };
  const headers = {
    'Content-Type': 'application/json',
    'apikey': 'RH8MzyCRMAfWsHGalUEEpmeLwb5j1HgT'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.data.answer;
  } catch (error) {
    console.error('Error asking question:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
};

const MedicalChatbot = ({ patientName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: `Hello! I'm your medical assistant. Want to know anything about ${patientName}?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Prepend patient name to the query if it's not already included
    const fullQuery = input.toLowerCase().includes(patientName.toLowerCase()) 
      ? input 
      : `${patientName}'s ${input}`;
    
    // Add user message with the full query
    setMessages(prev => [...prev, { type: 'user', content: fullQuery }]);
    
    setIsLoading(true);
    
    try {
      const answer = await askQuestion(fullQuery);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: answer
      }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 h-96 shadow-xl">
          <CardHeader className="bg-primary p-3 flex flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
              <span className="text-primary-foreground font-medium">Medical Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
            <ScrollArea className="flex-1 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="mb-2">
                <span className="font-bold text-primary">{patientName}'s</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex space-x-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="icon"
          className="w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        </Button>
      )}
    </div>
  );
};

export default MedicalChatbot;