'use client'

import { useRef, useEffect } from 'react'
import { useConversationStore } from '@/store/useConversationStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ConversationList() {
  const { conversations, selectConversation, activeConversation } = useConversationStore()
  const activeConversationId = activeConversation?.id
  const listRef = useRef<HTMLDivElement>(null)
  const prevFirstConvId = useRef<number | null>(null)

  // Auto-scroll to top when the first conversation changes (new message moved it up)
  useEffect(() => {
    if (conversations.length > 0) {
      const currentFirstId = conversations[0].id
      if (prevFirstConvId.current !== null && prevFirstConvId.current !== currentFirstId) {
        // New conversation at the top, scroll smoothly
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
      prevFirstConvId.current = currentFirstId
    }
  }, [conversations])

return (
<div ref={listRef} className="flex-1 overflow-y-auto bg-card scroll-smooth">
<AnimatePresence initial={false}>
{conversations.map((conv, index) => (
<motion.div
  key={conv.id}
  layout
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, x: -50 }}
  transition={{ duration: 0.25, delay: index < 5 ? index * 0.03 : 0 }}
  onClick={() => selectConversation(conv)}
  className={cn(
    "p-4 cursor-pointer hover:bg-background flex flex-col gap-2 border-b border-slate-100 transition-colors",
    activeConversationId === conv.id && "bg-blue-50/50 border-l-4 border-l-blue-600"
  )}
>
<div className="flex items-start gap-3">
<Avatar className="h-10 w-10 border border-border">
<AvatarImage src={conv.contact.avatar_url} />
<AvatarFallback>{conv.contact.name?.charAt(0)}</AvatarFallback>
</Avatar>
<div className="flex-1 min-w-0">
<div className="flex justify-between items-baseline">
<h4 className="text-sm font-bold truncate text-foreground">{conv.contact.name}</h4>
<span className="text-[10px] text-muted-foreground">#{conv.display_id}</span>
</div>
<p className="text-xs text-muted-foreground truncate">{conv.last_message_content}</p>
</div>
</div>

{/* Footer do Item (Assignee & Meta) */}
<div className="flex items-center justify-between mt-1">
<div className="flex items-center gap-1.5">
<Badge variant="outline" className="text-[9px] py-0 h-4 border-border text-muted-foreground bg-background">
{conv.inbox_name}
</Badge>
{conv.unread_count > 0 && (
<Badge className="bg-primary text-[9px] h-4 px-1 rounded-full">{conv.unread_count}</Badge>
)}
</div>

{/* Responsável (Assignee V3) */}
<div className="flex items-center gap-1">
<User className="h-3 w-3 text-muted-foreground" />
<span className={cn(
"text-[10px] font-medium",
"text-orange-400 italic" // Fallback simplified
)}>
{'Sem agente'}
</span>
</div>
</div>
</motion.div>
))}
</AnimatePresence>
</div>
)
}