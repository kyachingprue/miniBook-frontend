import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Heart,
  UserPlus,
  MessageCircle,
  AtSign,
  CheckCheck,
  BellOff,
  UserCheck,
  UserX,
  Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import PageHeader from '@/components/PageHeader'
import { timeAgo, cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { ContentSkeleton } from '@/components/loading/PageLoader'

const ICONS = {
  LIKE: { icon: Heart, color: 'bg-pink-500', text: 'liked your post' },
  FOLLOW: {
    icon: UserPlus,
    color: 'bg-brand-600',
    text: 'started following you'
  },
  FOLLOW_REQUEST: {
    icon: UserPlus,
    color: 'bg-amber-500',
    text: 'requested to follow you'
  },
  FOLLOW_ACCEPTED: {
    icon: UserCheck,
    color: 'bg-emerald-500',
    text: 'accepted your follow request'
  },
  FOLLOW_REJECTED: {
    icon: UserX,
    color: 'bg-neutral-500',
    text: 'declined your follow request'
  },
  COMMENT: {
    icon: MessageCircle,
    color: 'bg-sky-500',
    text: 'commented on your post'
  },
  MENTION: { icon: AtSign, color: 'bg-emerald-500', text: 'mentioned you' },
  MESSAGE: { icon: Mail, color: 'bg-violet-500', text: 'sent you a message' }
}

export default function Notifications() {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications(),
    refetchInterval: 10000
  })
  const read = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] })
    }
  })
  const clear = useMutation({
    mutationFn: () => api.clearNotifications(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] })
    }
  })
  const markOne = useMutation({
    mutationFn: id => api.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] })
    }
  })
  // Instant UI: patch the cached list first, then let the server confirm.
  const patchList = fn =>
    qc.setQueryData(['notifications'], old => (old ? fn(old) : old))
  const refreshFollowData = () => {
    ;[
      'notifications',
      'notification-unread-count',
      'follow-requests',
      'profile',
      'profile-people',
      'my-followers',
      'my-following',
      'suggestions'
    ].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
  }
  const accept = useMutation({
    mutationFn: username => api.acceptRequest(username),
    onMutate: async username => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      // "wants to follow you" + buttons  →  "started following you" (no buttons)
      patchList(list =>
        list.map(n =>
          n.type === 'FOLLOW_REQUEST' && n.actor?.username === username
            ? { ...n, type: 'FOLLOW', read: true }
            : n
        )
      )
    },
    onSuccess: () => toast.success('Follow request accepted'),
    onError: e => toast.error(e.message || 'Failed to accept'),
    onSettled: refreshFollowData
  })
  const reject = useMutation({
    mutationFn: username => api.rejectRequest(username),
    onMutate: async username => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      patchList(list =>
        list.filter(
          n => !(n.type === 'FOLLOW_REQUEST' && n.actor?.username === username)
        )
      )
    },
    onSuccess: () => toast.success('Follow request rejected'),
    onError: e => toast.error(e.message || 'Failed to reject'),
    onSettled: refreshFollowData
  })

  const items = (q.data || []).filter(n => n.type !== 'MESSAGE')
  const unread = items.filter(n => !n.read).length

  return (
    <>
      <SEO
        title="Notifications"
        description="Likes, follows, comments and mentions."
      />
      <PageHeader title="Notifications" subtitle={`${unread} unread`}>
        <div className="flex flex-col md:flex-row gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => read.mutate()}
            disabled={!unread || read.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => clear.mutate()}
            disabled={!items.length || clear.isPending}
          >
            Clear
          </Button>
        </div>
      </PageHeader>
      {q.isPending ? (
        <ContentSkeleton rows={5} />
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-neutral-500">
          <BellOff className="h-10 w-10" />
          <p>You’re all caught up.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-neutral-200 overflow-hidden dark:divide-neutral-800">
          {items.map((n, i) => {
            const cfg = ICONS[n.type] || ICONS.COMMENT
            const Icon = cfg.icon
            const isRequest = n.type === 'FOLLOW_REQUEST'
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                  !n.read && 'bg-brand-50/70 dark:bg-brand-600/10'
                )}
              >
                <Link
                  to={`/profile/${n.actor?.username || ''}`}
                  onClick={() => {
                    if (!n.read) markOne.mutate(n.id)
                  }}
                  className="relative shrink-0"
                >
                  <UserAvatar user={n.actor} className="h-12 w-12" />
                  <span
                    className={cn(
                      'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-neutral-900',
                      cfg.color
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link
                      to={`/profile/${n.actor?.username || ''}`}
                      className="font-bold hover:underline"
                      onClick={() => {
                        if (!n.read) markOne.mutate(n.id)
                      }}
                    >
                      {n.actor?.name || 'Someone'}
                    </Link>{' '}
                    {cfg.text}
                    {n.postId && (
                      <>
                        {' · '}
                        <Link
                          to={`/post/${n.postId}`}
                          className="text-brand-600 hover:underline"
                          onClick={() => {
                            if (!n.read) markOne.mutate(n.id)
                          }}
                        >
                          View post
                        </Link>
                      </>
                    )}
                  </p>
                  <span className="text-xs text-neutral-500">
                    {timeAgo(new Date(n.createdAt).getTime())}
                  </span>
                  {isRequest && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => accept.mutate(n.actor?.username)}
                        disabled={accept.isPending || reject.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject.mutate(n.actor?.username)}
                        disabled={accept.isPending || reject.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </Card>
      )}
    </>
  )
}
