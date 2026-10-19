import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  UserRoundPlus,
  RefreshCw,
  UserCheck,
  UserX,
  CalendarDays,
  Users,
  CircleDot,
  Bell
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { compact } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/avatar'
import PersonRow from '@/components/PersonRow'

// Re-exported so existing imports (Explore page) keep working
export { default as FollowRow } from '@/components/PersonRow'

const isOnline = lastSeenAt =>
  Boolean(lastSeenAt) && Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000

const sk = 'animate-pulse rounded bg-neutral-200 dark:bg-neutral-800'

function PeopleSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading people">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`h-10 w-10 shrink-0 rounded-full ${sk}`} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`h-3 w-24 ${sk}`} />
            <div className={`h-2.5 w-16 ${sk}`} />
          </div>
          <div className={`h-7 w-14 rounded-full ${sk}`} />
        </div>
      ))}
    </div>
  )
}

function SectionState({ query, empty, onRetry }) {
  if (query.isPending) return <PeopleSkeleton count={2} />
  if (query.isError)
    return (
      <div className="rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800/60">
        <p className="text-neutral-500">Couldn’t load this list.</p>
        <Button size="sm" variant="ghost" className="mt-1" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    )
  if (!query.data?.length)
    return <p className="text-sm text-neutral-500">{empty}</p>
  return null
}

/** Incoming follow requests with Accept / Reject — shows only when someone is waiting. */
function RequestsCard() {
  const qc = useQueryClient()
  const requests = useQuery({
    queryKey: ['follow-requests'],
    queryFn: () => api.pendingRequests(),
    refetchInterval: 15000
  })
  const refresh = () =>
    [
      'follow-requests',
      'notifications',
      'notification-unread-count',
      'my-followers',
      'profile',
      'profile-people'
    ].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
  const accept = useMutation({
    mutationFn: u => api.acceptRequest(u),
    onMutate: u =>
      qc.setQueryData(['follow-requests'], old =>
        (old || []).filter(x => x.username !== u)
      ),
    onSuccess: () => toast.success('Request accepted'),
    onError: e => toast.error(e.message || 'Could not accept'),
    onSettled: refresh
  })
  const reject = useMutation({
    mutationFn: u => api.rejectRequest(u),
    onMutate: u =>
      qc.setQueryData(['follow-requests'], old =>
        (old || []).filter(x => x.username !== u)
      ),
    onSuccess: () => toast.success('Request rejected'),
    onError: e => toast.error(e.message || 'Could not reject'),
    onSettled: refresh
  })
  if (!requests.data?.length) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Follow requests
          <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {requests.data.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {requests.data.slice(0, 4).map(u => (
          <div key={u.id} className="flex items-center gap-2.5">
            <Link to={`/profile/${u.username}`} className="shrink-0">
              <UserAvatar user={u} className="h-10 w-10" />
            </Link>
            <Link to={`/profile/${u.username}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{u.name}</p>
              <p className="truncate text-xs text-neutral-500">@{u.username}</p>
            </Link>
            <Button
              size="icon"
              className="h-8 w-8"
              aria-label="Accept"
              onClick={() => accept.mutate(u.username)}
            >
              <UserCheck className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              aria-label="Reject"
              onClick={() => reject.mutate(u.username)}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {requests.data.length > 4 && (
          <Link
            to="/notifications"
            className="text-xs font-semibold text-brand-600"
          >
            See all {requests.data.length} requests
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

export default function RightSidebar() {
  const qc = useQueryClient()
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api.trending() })
  const suggestions = useQuery({ queryKey: ['suggestions'], queryFn: () => api.suggestions() })
  const following = useQuery({
    queryKey: ['my-following'],
    queryFn: () => api.myFollowing(),
    refetchInterval: 60000
  })
  const events = useQuery({ queryKey: ['events'], queryFn: () => api.events() })
  const communities = useQuery({ queryKey: ['communities'], queryFn: () => api.communities() })

  const online = (following.data || []).filter(u => isOnline(u.lastSeenAt))

  const refreshAll = () =>
    ['trending', 'suggestions', 'my-following', 'follow-requests', 'events', 'communities'].forEach(k =>
      qc.invalidateQueries({ queryKey: [k] })
    )

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 flex-col gap-4 overflow-y-auto py-4 no-scrollbar xl:flex">
      {/* 1 · Follow */}
      <RequestsCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-brand-600" /> Who to follow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SectionState query={suggestions} empty="You’re all caught up. No suggestions right now." onRetry={() => suggestions.refetch()} />
          {!suggestions.isPending && !suggestions.isError &&
            suggestions.data?.map(u => <PersonRow key={u.id} user={u} />)}
        </CardContent>
      </Card>

      {/* 2 · Dynamic feature cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-emerald-500" /> Online now
            <span className="ml-auto text-xs font-medium text-neutral-500">{online.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {following.isPending ? (
            <div className="flex gap-2">{[0, 1, 2, 3].map(i => <div key={i} className={`h-10 w-10 rounded-full ${sk}`} />)}</div>
          ) : online.length ? (
            <div className="flex flex-wrap gap-3">
              {online.slice(0, 8).map(u => (
                <Link key={u.id} to="/messages" title={`${u.name} · message`} className="relative">
                  <UserAvatar user={u} className="h-10 w-10" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">None of the people you follow are online.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" /> Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {trending.isPending && (
            <div className="space-y-2">
              <div className={`h-3 w-24 ${sk}`} />
              <div className={`h-3 w-32 ${sk}`} />
            </div>
          )}
          {trending.data?.map(t => (
            <Link key={t.tag} to={`/explore?q=${encodeURIComponent(t.tag)}`} className="block rounded-lg hover:opacity-80">
              <p className="text-xs text-neutral-500">Trending topic</p>
              <p className="text-sm font-bold">#{t.tag}</p>
              <p className="text-xs text-neutral-500">{compact(t.posts)} posts</p>
            </Link>
          ))}
          {!trending.isPending && !trending.isError && trending.data?.length === 0 && (
            <p className="text-sm text-neutral-500">No trending topics yet.</p>
          )}
          {trending.isError && (
            <button onClick={() => trending.refetch()} className="text-left text-sm text-brand-600">
              Couldn’t load trends · Retry
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand-600" /> Upcoming events
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {events.isPending && <div className={`h-10 w-full ${sk}`} />}
          {events.data?.slice(0, 3).map(e => {
            const d = new Date(e.startsAt)
            return (
              <Link key={e.id} to="/events" className="flex items-center gap-3 hover:opacity-80">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15">
                  <span className="text-[10px] font-bold uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
                  <span className="text-sm font-extrabold leading-none">{d.getDate()}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{e.title}</p>
                  <p className="truncate text-xs text-neutral-500">{compact(e.goingCount || 0)} going · {e.location}</p>
                </div>
              </Link>
            )
          })}
          {!events.isPending && !events.data?.length && <p className="text-sm text-neutral-500">No upcoming events.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" /> Communities
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {communities.isPending && <div className={`h-10 w-full ${sk}`} />}
          {communities.data?.slice(0, 3).map(c => (
            <Link key={c.id} to="/communities" className="block hover:opacity-80">
              <p className="truncate text-sm font-bold">{c.name}</p>
              <p className="text-xs text-neutral-500">{compact(c.membersCount ?? c.members ?? 0)} members</p>
            </Link>
          ))}
          {!communities.isPending && !communities.data?.length && <p className="text-sm text-neutral-500">No communities yet.</p>}
        </CardContent>
      </Card>

      <button onClick={refreshAll} className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-neutral-500 transition hover:text-brand-600">
        <RefreshCw className="h-3 w-3" /> Refresh
      </button>
      <p className="px-2 text-xs text-neutral-500">© 2026 MiniBook · Privacy · Terms · About</p>
    </aside>
  )
}
