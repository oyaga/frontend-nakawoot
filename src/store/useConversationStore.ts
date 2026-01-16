import { create } from "zustand";
import api from "@/lib/api";

interface Contact {
  id: number;
  name: string;
  avatar_url: string;
  email: string;
  phone_number: string;
  custom_attributes: Record<string, unknown>;
  additional_attributes: Record<string, unknown>;
}

export interface ConversationSummary {
  id: number;
  display_id: number;
  status: number;
  last_message_content: string;
  last_message_at: string;
  last_activity_at?: number | string; // Support both formats
  contact: Contact;
  inbox_name: string;
  unread_count: number;
  created_at?: string | number;
}

export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  message_type: number;
  status: string;
  created_at: string;
  content_type?: string;
  media_url?: string;
  file_name?: string;
  mime_type?: string;
  is_from_me?: boolean; // Added for unread logic
}

interface Activity {
  id: number;
  activity_type: string;
  user?: { name: string };
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ConversationState {
  conversations: ConversationSummary[];
  activeConversation: ConversationSummary | null;
  messages: Message[];
  activities: Activity[];
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (conv: ConversationSummary) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateConversation: (conversation: ConversationSummary) => void;
  addConversation: (conversation: ConversationSummary) => void;
  removeConversation: (conversationId: number) => void;
  removeConversationsByInbox: (inboxId: number) => void;
}

const getTimestamp = (input: string | number | undefined): number => {
  if (!input) return 0;
  if (typeof input === "number") {
    // If < 10 billion, assume seconds (Unix timestamp)
    if (input < 10000000000) {
      return input * 1000;
    }
    return input;
  }
  return new Date(input).getTime();
};

const sortConversations = (conversations: ConversationSummary[]) => {
  return [...conversations].sort((a, b) => {
    const timeA = getTimestamp(
      a.last_activity_at || a.last_message_at || a.created_at
    );
    const timeB = getTimestamp(
      b.last_activity_at || b.last_message_at || b.created_at
    );
    return timeB - timeA;
  });
};

// Helper to remove duplicate conversations by ID
const deduplicateConversations = (conversations: ConversationSummary[]) => {
  const seen = new Set<number>();
  return conversations.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
};

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  activities: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const [convResponse, unreadResponse] = await Promise.all([
        api.get("/conversations"),
        api.get("/conversations/unread-counts"),
      ]);

      const conversations = sortConversations(convResponse.data);
      const unreadCounts = unreadResponse.data.unread_counts || {};

      // Merge unread counts
      const mergedConversations = conversations.map((c) => ({
        ...c,
        unread_count: unreadCounts[c.id] || 0,
      }));

      set({ conversations: mergedConversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  selectConversation: async (conv) => {
    // Reset unread count locally when selecting
    set((state) => ({
      activeConversation: conv,
      messages: [],
      conversations: state.conversations.map((c) =>
        c.id === conv.id ? { ...c, unread_count: 0 } : c
      ),
    }));

    try {
      const response = await api.get(`/conversations/${conv.id}/messages`);
      const messages = response.data.messages || [];
      set({ messages: messages.reverse() });

      // Also mark as read in backend
      await api.post(`/conversations/${conv.id}/read`);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  },

  sendMessage: async (content) => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    try {
      const response = await api.post(
        `/conversations/${activeConversation.id}/messages`,
        {
          content,
          message_type: 1, // Outgoing
        }
      );

      // addMessage handles the UI update
      const newMessage = response.data;
      get().addMessage(newMessage);
    } catch (error) {
      console.error("Erro no envio coordenado:", error);
      throw error;
    }
  },

  addMessage: (message) => {
    const { messages, conversations, activeConversation } = get();

    console.log("[Store] addMessage:", message);

    // 1. Update Chat History (if active)
    const exists = messages.some((m) => m.id === message.id);
    if (!exists && activeConversation?.id == message.conversation_id) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    }

    // 2. Update Sidebar List (Optimistic)
    const convIndex = conversations.findIndex(
      (c) => c.id == message.conversation_id
    );
    if (convIndex !== -1) {
      const existingConv = conversations[convIndex];

      // Increment unread if incoming and not currently active
      let newUnreadCount = existingConv.unread_count || 0;
      const isIncoming = !message.is_from_me && message.message_type !== 1;

      console.log("[Store] Processing unread:", {
        isIncoming,
        activeId: activeConversation?.id,
        msgConvId: message.conversation_id,
        currentUnread: newUnreadCount,
      });

      if (isIncoming && activeConversation?.id != message.conversation_id) {
        newUnreadCount += 1;
      } else if (activeConversation?.id == message.conversation_id) {
        // If active, ensure it stays 0
        newUnreadCount = 0;
      }

      const updatedConv = {
        ...existingConv,
        last_message_content: message.content,
        // Use message time or fallback to now for sorting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        last_activity_at:
          message.created_at ||
          (message as any).timestamp ||
          new Date().toISOString(),
        unread_count: newUnreadCount,
      };

      console.log("[Store] Updated conv:", updatedConv);

      const newConvs = [...conversations];
      newConvs.splice(convIndex, 1); // Remove old
      newConvs.unshift(updatedConv); // Add updated to top

      // Deduplicate and sort to prevent duplicate keys
      set({ conversations: deduplicateConversations(newConvs) });
    }
  },

  updateConversation: (conversation) => {
    console.log("[Store] updateConversation:", conversation);
    set((state) => {
      const index = state.conversations.findIndex(
        (c) => c.id == conversation.id
      );
      if (index !== -1) {
        const existing = state.conversations[index];

        // Merge updates, preserving existing data if payload is partial
        // This is crucial because backend might send "thin" updates without contact info
        const updated = {
          ...existing,
          ...conversation,
          // Ensure contact is preserved if missing in update
          contact: conversation.contact || existing.contact,
          // Ensure last message is preserved if missing
          last_message_content:
            conversation.last_message_content || existing.last_message_content,
        };

        const newConvs = [...state.conversations];
        newConvs.splice(index, 1);
        newConvs.unshift(updated);

        // Deduplicate and sort to prevent duplicate keys
        return { conversations: deduplicateConversations(sortConversations(newConvs)) };
      }
      return state;
    });
  },

  addConversation: (conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (!exists) {
        const newConvs = [conversation, ...state.conversations];
        return { conversations: sortConversations(newConvs) };
      }
      return state;
    });
  },

  removeConversation: (conversationId) => {
    set((state) => {
      const filtered = state.conversations.filter(
        (c) => c.id !== conversationId
      );

      // Se a conversa ativa foi deletada, limpar seleção
      const newActiveConversation =
        state.activeConversation?.id === conversationId
          ? null
          : state.activeConversation;

      return {
        conversations: filtered,
        activeConversation: newActiveConversation,
        messages: newActiveConversation ? state.messages : [],
      };
    });
  },

  removeConversationsByInbox: (inboxId) => {
    set((state) => {
      // Filtrar conversas que não pertencem a esta inbox
      const filtered = state.conversations.filter(
        (c) => c.inbox_name !== inboxId.toString()
      );

      // Se a conversa ativa pertencia à inbox deletada, limpar seleção
      const activeConvBelongsToInbox =
        state.activeConversation &&
        state.conversations.find((c) => c.id === state.activeConversation!.id)
          ?.inbox_name === inboxId.toString();

      return {
        conversations: filtered,
        activeConversation: activeConvBelongsToInbox
          ? null
          : state.activeConversation,
        messages: activeConvBelongsToInbox ? [] : state.messages,
      };
    });
  },
}));
