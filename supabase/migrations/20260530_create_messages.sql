-- ================================================
-- Real-time Chat: messages table
-- Stores 1:1 messages between accepted connections.
-- Supports read receipts via read_at timestamp.
-- ================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT no_self_message CHECK (sender_profile_id <> receiver_profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read messages they sent or received
CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM public.profiles
        WHERE id = sender_profile_id OR id = receiver_profile_id
    )
);

-- INSERT: Users can send messages only if they are the sender
-- AND an accepted connection exists between sender and receiver
CREATE POLICY "Users can send messages to accepted connections"
ON public.messages
FOR INSERT
WITH CHECK (
    -- Caller must own the sender profile
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = sender_profile_id)
    AND
    -- An accepted connection must exist between sender and receiver
    EXISTS (
        SELECT 1 FROM public.connection_requests
        WHERE status = 'accepted'
        AND (
            (sender_id = sender_profile_id AND receiver_id = receiver_profile_id)
            OR
            (sender_id = receiver_profile_id AND receiver_id = sender_profile_id)
        )
    )
);

-- UPDATE: Receivers can mark messages as read (update read_at only)
CREATE POLICY "Receivers can mark messages as read"
ON public.messages
FOR UPDATE
USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = receiver_profile_id)
)
WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = receiver_profile_id)
);

-- ================================================
-- Indexes for performance
-- ================================================

-- Conversation lookup: messages between two users ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON public.messages (
    LEAST(sender_profile_id, receiver_profile_id),
    GREATEST(sender_profile_id, receiver_profile_id),
    created_at DESC
);

-- Unread messages for a receiver
CREATE INDEX IF NOT EXISTS idx_messages_unread
ON public.messages (receiver_profile_id, read_at)
WHERE read_at IS NULL;

-- Recent messages per receiver (for conversation list)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created
ON public.messages (receiver_profile_id, created_at DESC);

-- Recent messages per sender (for conversation list)
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
ON public.messages (sender_profile_id, created_at DESC);

-- ================================================
-- Enable Supabase Realtime on the messages table
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
