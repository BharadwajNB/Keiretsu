'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Users, Code, Cpu, Send, X } from 'lucide-react';
import styles from './ConnectModal.module.css';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

const COLLAB_INTENTS = [
  { id: 'startup', label: 'Startup Idea', icon: Rocket },
  { id: 'hackathon', label: 'Hackathon Team', icon: Users },
  { id: 'opensource', label: 'Open Source', icon: Code },
  { id: 'aiml', label: 'AI/ML Project', icon: Cpu },
];

export default function ConnectModal({ isOpen, onClose, recipientName }: ConnectModalProps) {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIntent(null);
      setMessage('');
      setIsSending(false);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!selectedIntent) return;
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      onClose();
      // In a real app, we'd show a toast here
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Start Collaboration</h2>
              <p className={styles.subtitle}>Connect with {recipientName} and build something amazing together</p>
            </div>

            <div className={styles.intentGrid}>
              {COLLAB_INTENTS.map((intent) => {
                const Icon = intent.icon;
                return (
                  <button
                    key={intent.id}
                    className={`${styles.intentCard} ${
                      selectedIntent === intent.id ? styles.intentCardActive : ''
                    }`}
                    onClick={() => setSelectedIntent(intent.id)}
                  >
                    <Icon size={24} className={styles.intentIcon} />
                    <span className={styles.intentLabel}>{intent.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                placeholder="Briefly introduce yourself and your idea..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <button
                className={styles.sendBtn}
                disabled={!selectedIntent || isSending}
                onClick={handleSend}
              >
                {isSending ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    <Send size={18} />
                    Send Request
                  </>
                )}
              </button>
              <button className={styles.closeBtn} onClick={onClose}>
                Cancel
              </button>
            </div>
            
            <button className={styles.modalCloseIcon} onClick={onClose}>
                <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
