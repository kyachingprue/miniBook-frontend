import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Smile, MessageCircleHeart } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '@/components/SEO'
import PageHeader from '@/components/PageHeader'
import { timeAgo, cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'

function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false
  const diff = Date.now() - new Date(lastSeenAt).getTime()
  return diff < 5 * 60 * 1000
}

const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '🙃',
    '😉',
    '😊',
    '😇',
    '🥰',
    '😍',
    '🤩',
    '😘',
    '😗',
    '😚',
    '😙',
    '🥲',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '😮‍💨',
    '🤥',
    '😌',
    '😔',
    '😪',
    '🤤',
    '😴',
    '😷',
    '🤒',
    '🤕'
  ],
  Gestures: [
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🫰',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '🫶',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '💪',
    '🦾',
    '💅',
    '🤳',
    '✍️',
    '❤️',
    '🧡'
  ],
  Hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
    '♥️',
    '💌',
    '💋',
    '💯',
    '💢',
    '💥',
    '💫',
    '💦',
    '💨',
    '🕳️',
    '💬'
  ],
  Animals: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐻‍❄️',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐒',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗'
  ],
  Food: [
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🫐',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
    '🍅',
    '🍆',
    '🥑',
    '🥦',
    '🍕',
    '🍔',
    '🍟',
    '🌭',
    '🍿',
    '🧂',
    '🥓',
    '🥚',
    '🍳',
    '🧇'
  ],
  Activity: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🪃',
    '🥅',
    '⛳',
    '🎯',
    '🎮',
    '🕹️',
    '🎲',
    '🧩',
    '♟️',
    '🎭',
    '🎨',
    '🎬',
    '🎤'
  ]
}

function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState('Smileys')
  const categories = Object.keys(EMOJI_CATEGORIES)

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
    <div
        className={cn(
          'flex gap-1 overflow-x-auto border-b border-neutral-200 px-2 py-1.5 dark:border-neutral-700',
          // Hide scrollbar by default
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0',
          // Show thin scrollbar on hover / while interacting
          'hover:[scrollbar-width:thin] hover:[&::-webkit-scrollbar]:h-1.5 hover:[&::-webkit-scrollbar]:w-1.5',
          'hover:[&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300',
          'dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600',
          'hover:[&::-webkit-scrollbar-track]:bg-transparent'
        )}
      >
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setTab(cat)}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              tab === cat
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-400'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid — vertical scroll, same auto-hide behavior */}
      <div
        className={cn(
          'grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0',
          'hover:[scrollbar-width:thin] hover:[&::-webkit-scrollbar]:h-1.5 hover:[&::-webkit-scrollbar]:w-1.5',
          'hover:[&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300',
          'dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600',
          'hover:[&::-webkit-scrollbar-track]:bg-transparent'
        )}
      >
        {EMOJI_CATEGORIES[tab].map((emoji, i) => (
          <button
            key={tab + i}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="border-t border-neutral-200 px-3 py-1.5 text-right dark:border-neutral-700">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Close
        </button>
      </div>
      <div className="border-t border-neutral-200 px-3 py-1.5 text-right dark:border-neutral-700">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function EmptyChat({ user }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-brand-400/20 to-pink-400/20 blur-xl" />
        <UserAvatar
          user={user}
          className="relative h-24 w-24 ring-4 ring-white dark:ring-neutral-900"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          {user?.name || user?.username}
        </h3>
        <p className="text-sm text-neutral-500">@{user?.username}</p>
      </div>
      <div className="max-w-xs space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-600/20">
          <MessageCircleHeart className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          You&apos;re friends on Vibora
        </p>
        <p className="text-xs leading-relaxed text-neutral-500">
          Say hi and start the conversation. Messages are private between you
          and {user?.name?.split(' ')[0] || user?.username}.
        </p>
      </div>
    </div>
  )
}

export default function Messages() {
  const me = useSelector(s => s.auth.user)
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState(null)
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const endRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const emojiWrapRef = useRef(null)

  const messageable = useQuery({
    queryKey: ['messageable'],
    queryFn: () => api.messageableUsers(),
    enabled: Boolean(me),
    staleTime: 30000
  })

  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.conversations(),
    refetchInterval: 6000
  })

  const active = (conversations.data || []).find(c => c.id === activeId) || null
  // Only the conversation you actually opened counts as "being read"
  const shown = active
  const conversationId = activeId

  const messages = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      api.messages(conversationId).then(rows => rows.slice().reverse()),
    enabled: Boolean(conversationId),
    refetchInterval: 3000
  })

  // Opening a chat — or receiving a message while it is open — marks it as read
  const activeUnread = active?.unreadCount || 0
  useEffect(() => {
    if (!conversationId) return
    api
      .markConversationRead(conversationId)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['conversations'] })
        qc.invalidateQueries({ queryKey: ['message-unread-count'] })
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, activeUnread])

  useEffect(() => {
    if (!emojiOpen) return
    const handler = e => {
      if (emojiWrapRef.current && !emojiWrapRef.current.contains(e.target)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  useEffect(() => {
    setEmojiOpen(false)
  }, [conversationId])

  const start = useMutation({
    mutationFn: targetUsername => api.startConversation(targetUsername),
    onSuccess: async data => {
      await qc.invalidateQueries({ queryKey: ['conversations'] })
      setActiveId(data.id)
    },
    onError: e => toast.error(e.message || 'Cannot start conversation')
  })

  const send = useMutation({
    mutationFn: () => api.sendMessage(conversationId, text.trim()),
    onSuccess: async () => {
      setText('')
      setEmojiOpen(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
        qc.invalidateQueries({ queryKey: ['conversations'] }),
        qc.invalidateQueries({ queryKey: ['message-unread-count'] })
      ])
    },
    onError: e => toast.error(e.message || 'Failed to send')
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.data?.length, conversationId])

  const insertEmoji = emoji => {
    setText(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const last = c => c?.lastMessage?.text || 'Start a conversation'
  const showList = !activeId
  const messageList = messages.data || []
  const isEmptyChat =
    conversationId && !messages.isPending && messageList.length === 0

  return (
    <>
      <SEO title="Messages" description="Chat with your connections." />
      {/* <PageHeader title="Messages" /> */}

      <Card
        className={cn(
          'grid overflow-hidden',
          'h-[calc(100dvh-12rem)] min-h-[360px] max-h-[720px]',
          'md:h-[calc(100dvh-9rem)]',
          'grid-cols-1 md:grid-cols-[280px_1fr]'
        )}
      >
        {/* Conversation list */}
        <div
          className={cn(
            'min-h-0 flex-col overflow-y-auto border-neutral-200 dark:border-neutral-800',
            'md:flex md:border-r',
            showList ? 'flex' : 'hidden md:flex'
          )}
        >
          <div className="shrink-0 border-b border-neutral-200 p-3 dark:border-neutral-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Your connections
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(messageable.data || []).slice(0, 12).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => start.mutate(u.username)}
                  className="flex shrink-0 flex-col items-center gap-1"
                  title={'Message @' + u.username}
                >
                  <div className="relative">
                    <UserAvatar user={u} className="h-12 w-12" />
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-900',
                        isOnline(u.lastSeenAt)
                          ? 'bg-emerald-500'
                          : 'bg-neutral-400'
                      )}
                    />
                  </div>
                  <span className="max-w-[56px] truncate text-[10px] text-neutral-600 dark:text-neutral-400">
                    {u.name?.split(' ')[0] || u.username}
                  </span>
                </button>
              ))}
              {(messageable.data || []).length === 0 && (
                <p className="text-xs text-neutral-500">
                  Accept follow requests to message people.
                </p>
              )}
            </div>
          </div>

          {(conversations.data || []).map(c => {
            const unread = c.unreadCount > 0
            const mineLast = c.lastMessage?.senderId === me?.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                  conversationId === c.id && 'bg-brand-50/60 dark:bg-brand-600/10',
                  unread && conversationId !== c.id && 'bg-brand-50/40 dark:bg-brand-600/5'
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar user={c.user} className="h-11 w-11" />
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900',
                      isOnline(c.user?.lastSeenAt)
                        ? 'bg-emerald-500'
                        : 'bg-neutral-400'
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        unread
                          ? 'font-extrabold text-neutral-950 dark:text-white'
                          : 'font-medium text-neutral-700 dark:text-neutral-300'
                      )}
                    >
                      {c.user?.name || c.user?.username}
                    </span>
                    {c.lastMessage && (
                      <span
                        className={cn(
                          'shrink-0 text-[10px]',
                          unread
                            ? 'font-bold text-brand-600'
                            : 'text-neutral-400'
                        )}
                      >
                        {timeAgo(new Date(c.lastMessage.createdAt).getTime())}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-xs',
                        unread
                          ? 'font-bold text-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-500'
                      )}
                    >
                      {mineLast && 'You: '}
                      {last(c)}
                    </p>
                    {unread && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {(conversations.data || []).length === 0 && (
            <p className="p-4 text-center text-sm text-neutral-500">
              No conversations yet. Tap a connection above to start chatting.
            </p>
          )}
        </div>

        {/* Chat pane */}
        <div
          className={cn(
            'min-h-0 flex-col overflow-hidden',
            shown ? 'flex' : 'hidden md:flex'
          )}
        >
          {shown ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white/80 px-3 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden"
                  onClick={() => setActiveId(null)}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <UserAvatar user={shown.user} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">
                    {shown.user?.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {isOnline(shown.user?.lastSeenAt)
                      ? 'Online'
                      : shown.user?.lastSeenAt
                        ? 'Last active ' +
                          timeAgo(new Date(shown.user.lastSeenAt).getTime())
                        : 'Offline'}
                  </p>
                </div>
              </div>

              <div
                ref={scrollRef}
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto overflow-x-hidden',
                  'bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0/0.04)_1px,transparent_0)] bg-[size:20px_20px]',
                  'bg-gradient-to-b from-brand-50/40 via-white to-pink-50/30',
                  'dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.04)_1px,transparent_0)] dark:bg-[size:20px_20px]',
                  'dark:from-neutral-950 dark:via-neutral-950 dark:to-brand-950/30'
                )}
              >
                {isEmptyChat ? (
                  <EmptyChat user={shown.user} />
                ) : (
                  <div className="space-y-2 p-3">
                    {messageList.map((m, idx) => {
                      const mine = m.senderId === me?.id
                      const lastMine =
                        mine &&
                        !messageList.slice(idx + 1).some(x => x.senderId === me?.id)
                      const seen =
                        shown.otherLastReadAt &&
                        new Date(shown.otherLastReadAt) >= new Date(m.createdAt)
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'flex w-full',
                            mine ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[min(75%,28rem)] break-words rounded-2xl px-3 py-2 text-sm shadow-sm',
                              'whitespace-pre-wrap [overflow-wrap:anywhere]',
                              mine
                                ? 'bg-brand-600 text-white'
                                : 'bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                            )}
                          >
                            {m.text}
                            <p
                              className={cn(
                                'mt-0.5 text-[10px]',
                                mine ? 'text-white/70' : 'text-neutral-500'
                              )}
                            >
                              {timeAgo(new Date(m.createdAt).getTime())}
                              {lastMine && (
                                <span className="ml-1.5 font-semibold">
                                  · {seen ? 'Seen' : 'Sent'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={endRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (text.trim() && !send.isPending) send.mutate()
                }}
                className="relative flex shrink-0 items-center gap-1.5 border-t border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-950 sm:gap-2 sm:p-3"
              >
                <div ref={emojiWrapRef} className="relative shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-neutral-500 hover:text-brand-600"
                    aria-label="Emoji"
                    onClick={() => setEmojiOpen(v => !v)}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  {emojiOpen && (
                    <EmojiPicker
                      onSelect={insertEmoji}
                      onClose={() => setEmojiOpen(false)}
                    />
                  )}
                </div>

                <Input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="min-w-0 flex-1"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'Escape') setEmojiOpen(false)
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={!text.trim() || send.isPending}
                  aria-label="Send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-neutral-500">
              <MessageCircleHeart className="h-12 w-12 text-brand-400/60" />
              <p className="text-sm font-medium">
                Select a conversation or connection to start chatting.
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
