import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

export function ChatSupport() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'assistant', text: 'Hi! How can I help you today?', ts: Date.now() }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = Date.now();
    const userMsg: ChatMessage = { id: 'u-' + now, role: 'user', text, ts: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    // Simple placeholder assistant response. Replace with real backend later.
    const assistantMsg: ChatMessage = {
      id: 'a-' + (now + 1),
      role: 'assistant',
      text: 'Thanks! Aavek support will assist you shortly.',
      ts: now + 1,
    };
    setTimeout(() => setMessages((prev) => [...prev, assistantMsg]), 300);
  };

  return (
    <div className="pointer-events-none">
      {/* Floating button */}
      <button
        aria-label="Open support chat"
        className="pointer-events-auto fixed bottom-6 right-6 z-[9999] rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 h-12 w-12 flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed bottom-24 right-6 z-[9999] w-80 max-w-[90vw]"
          >
            <div className="rounded-xl border bg-card shadow-xl">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="text-sm font-semibold">Aavek Support</div>
                <button
                  className="rounded p-1 hover:bg-muted"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-auto px-3 py-2 space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === 'assistant'
                        ? 'text-sm p-2 rounded-lg bg-muted'
                        : 'text-sm p-2 rounded-lg bg-primary/10'
                    }
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 p-3 border-t">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border bg-background px-2 py-2 text-sm"
                />
                <button
                  onClick={send}
                  className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm shadow hover:opacity-90"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
