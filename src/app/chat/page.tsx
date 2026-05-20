'use client';

import Navbar from '@/components/layout/Navbar';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="page" style={{ height: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, position: 'relative' }}>
        <ChatInterface />
      </main>
    </div>
  );
}
