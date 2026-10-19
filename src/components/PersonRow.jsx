import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/avatar'

const FOLLOW_KEYS = [
  'suggestions',
  'my-following',
  'my-followers',
  'profile',
  'profile-people',
  'follow-requests'
]

/**
 * One person in any list (followers, following, suggestions…).
 * The button always reflects YOUR relationship with that person:
 *   Follow → Requested (waits for their approval) → Following
 * `onNavigate` lets a modal close itself when the profile link is clicked.
 */
export default function PersonRow({
  user,
  onNavigate,
  showButton = true,
  className = ''
}) {
  const qc = useQueryClient()
  const following = Boolean(user.isFollowing)
  const requested = Boolean(user.isRequested)

  const toggle = useMutation({
    mutationFn: () => {
      if (requested) return api.cancelRequest(user.username)
      return api.follow(user.username, following)
    },
    onSuccess: () => {
      if (!following && !requested) toast.success('Follow request sent')
    },
    onError: e => toast.error(e.message || 'Action failed'),
    onSettled: () =>
      Promise.all(FOLLOW_KEYS.map(k => qc.invalidateQueries({ queryKey: [k] })))
  })

  const label = toggle.isPending
    ? '…'
    : requested
      ? 'Requested'
      : following
        ? 'Following'
        : user.isFollower
          ? 'Follow back'
          : 'Follow'

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <Link
        to={`/profile/${user.username}`}
        onClick={onNavigate}
        className="shrink-0"
      >
        <UserAvatar
          user={user}
          className="h-10 w-10 ring-1 ring-neutral-200 dark:ring-neutral-700"
        />
      </Link>
      <Link
        to={`/profile/${user.username}`}
        onClick={onNavigate}
        className="min-w-0 flex-1"
      >
        <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">
          {user.name}
        </p>
        <p className="truncate text-xs text-neutral-500">@{user.username}</p>
      </Link>
      {showButton && !user.isMe && (
        <Button
          size="sm"
          variant={following || requested ? 'outline' : 'default'}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate()}
          className="shrink-0 px-2.5"
        >
          {label}
        </Button>
      )}
    </div>
  )
}
