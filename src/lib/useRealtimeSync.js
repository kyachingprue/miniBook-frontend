import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onRealtime } from '@/lib/socket'

/**
 * Keeps badges, notifications, follow lists and chats fresh the moment the API pushes an event
 * (Socket.IO). Polling stays as a safety net, so everything still works if the socket drops.
 */
export function useRealtimeSync() {
  const qc = useQueryClient()
  useEffect(() => {
    const refreshNotifications = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] })
      qc.invalidateQueries({ queryKey: ['follow-requests'] })
    }
    const refreshFollow = () => {
      refreshNotifications()
      ;['profile', 'profile-people', 'my-following', 'my-followers', 'suggestions', 'messageable'].forEach(k =>
        qc.invalidateQueries({ queryKey: [k] })
      )
    }
    const refreshMessages = payload => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['message-unread-count'] })
      if (payload?.conversationId)
        qc.invalidateQueries({ queryKey: ['messages', payload.conversationId] })
    }
    return onRealtime({
      'notification:new': refreshNotifications,
      'notification:changed': refreshNotifications,
      'follow:changed': refreshFollow,
      'message:new': refreshMessages,
      'message:read': refreshMessages
    })
  }, [qc])
}
