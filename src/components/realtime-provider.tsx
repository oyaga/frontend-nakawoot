'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRealtime } from '@/hooks/useRealtime'
import { useConversationStore, Message, ConversationSummary } from '@/store/useConversationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore()
  const storeRef = useRef(useConversationStore.getState())
  
  // Keep store reference up to date
  useEffect(() => {
    return useConversationStore.subscribe((state) => {
      storeRef.current = state
    })
  }, [])

  // Memoize the event handler to prevent infinite re-renders
  const handleEvent = useCallback((event: { type: string; payload: unknown }) => {
    const store = storeRef.current

    switch (event.type) {
      case 'message.new':
        store.addMessage(event.payload as Message)
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-update'))
        break

      case 'conversation.updated':
        store.updateConversation(event.payload as ConversationSummary)
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-update'))
        break

      case 'conversation.new':
        store.addConversation(event.payload as ConversationSummary)
        store.fetchConversations()
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-update'))
        break

      case 'conversation.deleted':
        const deletedPayload = event.payload as { id: number }
        const deletedId = typeof deletedPayload === 'object' && deletedPayload !== null
          ? deletedPayload.id
          : Number(deletedPayload)
        store.removeConversation(deletedId)
        toast.success('Conversa deletada com sucesso')
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-update'))
        break

      case 'inbox.cleared':
        const inboxPayload = event.payload as { inbox_id: number; count: number }
        if (typeof inboxPayload === 'object' && inboxPayload !== null) {
          const inboxId = inboxPayload.inbox_id
          const count = inboxPayload.count || 0
          store.removeConversationsByInbox(Number(inboxId))
          toast.success(`${count} conversa(s) removida(s) da inbox`)
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-update'))
        }
        break

      case 'contact.created':
      case 'contact.updated':
        // Emit a custom event that the contacts page can listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('contact-update', { detail: event.payload }))
          window.dispatchEvent(new CustomEvent('dashboard-update'))
        }
        break

      case 'message.reaction':
        // Emit a custom event for message reactions
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('message-reaction', { detail: event.payload }))
        }
        break

      case 'inbox.created':
      case 'inbox.updated':
      case 'inbox.deleted':
        // Emit a custom event for inbox changes so inboxes page can refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inbox-update', { detail: event.payload }))
          window.dispatchEvent(new CustomEvent('dashboard-update'))
        }
        break

      default:
    }
  }, [])

  useRealtime({
    onEvent: handleEvent,
  })

  // Fetch inicial das conversas quando o usuário loga
  useEffect(() => {
    if (session) {
      useConversationStore.getState().fetchConversations()
    }
  }, [session])

  return <>{children}</>
}

