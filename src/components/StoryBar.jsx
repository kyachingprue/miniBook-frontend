import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { UserAvatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function StoryRing({ user, hasUnviewed, isOwn, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
    >
      <span
        className={cn(
          'relative rounded-full p-[2.5px]',
          hasUnviewed
            ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
            : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span className="block rounded-full bg-white p-[2px] dark:bg-neutral-900">
          <UserAvatar user={user} className="h-14 w-14 sm:h-16 sm:w-16" />
        </span>
        {isOwn && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white dark:ring-neutral-900">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
        {isOwn ? 'Your story' : user.username}
      </span>
    </button>
  )
}

function StoryViewer({ groups, startIndex, onClose }) {
  const [groupIdx, setGroupIdx] = useState(startIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const qc = useQueryClient()

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]
  const duration = story?.mediaType === 'video' ? 15000 : 5000

  const markViewed = useMutation({
    mutationFn: id => api.viewStory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  })

  const goNext = useCallback(() => {
    if (!group) return
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1)
      setProgress(0)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1)
      setStoryIdx(0)
      setProgress(0)
    } else {
      onClose()
    }
  }, [group, storyIdx, groupIdx, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1)
      setProgress(0)
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1)
      setStoryIdx(0)
      setProgress(0)
    }
  }, [storyIdx, groupIdx])

  useEffect(() => {
    if (!story) return
    if (!story.viewed) markViewed.mutate(story.id)
    setProgress(0)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration)
      setProgress(p)
      if (p >= 1) goNext()
    }, 50)
    return () => clearInterval(timerRef.current)
  }, [story?.id])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  if (!story || !group) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 flex gap-1 px-3 pt-3">
        {group.stories.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{
                width: i < storyIdx ? '100%' : i === storyIdx ? `${progress * 100}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Author */}
      <div className="absolute left-4 top-8 flex items-center gap-2 text-white">
        <UserAvatar user={group.author} className="h-8 w-8 ring-2 ring-white/40" />
        <span className="text-sm font-semibold">{group.author.username}</span>
      </div>

      {/* Media */}
      <div className="relative flex h-full max-h-[90vh] w-full max-w-md items-center justify-center px-2">
        {story.mediaType === 'video' ? (
          <video
            key={story.id}
            src={story.mediaUrl}
            className="max-h-full max-w-full rounded-lg object-contain"
            autoPlay
            playsInline
            muted={false}
          />
        ) : (
          <img
            key={story.id}
            src={story.mediaUrl}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
        {story.caption && (
          <p className="absolute bottom-8 left-4 right-4 text-center text-sm text-white drop-shadow">
            {story.caption}
          </p>
        )}
      </div>

      {/* Nav zones */}
      <button
        type="button"
        className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
        onClick={goPrev}
        aria-label="Previous"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
        onClick={goNext}
        aria-label="Next"
      />

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}

export default function StoryBar() {
  const me = useSelector(s => s.auth.user)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [startIdx, setStartIdx] = useState(0)
  const fileRef = useRef(null)
  const qc = useQueryClient()

  const stories = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.stories(),
    enabled: Boolean(me),
  })

  const createStory = useMutation({
    mutationFn: async file => {
      // Reuse existing upload signature / Cloudinary flow
      const signed = await api.imageUploadSignature()
      const body = new FormData()
      Object.entries(signed.fields || {}).forEach(([k, v]) => body.append(k, String(v)))
      body.append('file', file)
      const uploadRes = await fetch(signed.uploadUrl || signed.url, {
        method: 'POST',
        body,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const data = await uploadRes.json()
      const mediaUrl = data.secure_url || data.url
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      return api.createStory({ mediaUrl, mediaType })
    },
    onMutate: () => toast.loading('Adding story…', { id: 'story' }),
    onSuccess: () => {
      toast.success('Story added', { id: 'story' })
      qc.invalidateQueries({ queryKey: ['stories'] })
    },
    onError: err => toast.error(err.message || 'Failed to add story', { id: 'story' }),
  })

  const groups = stories.data || []
  const ownGroup = groups.find(g => g.author.id === me?.id)
  const otherGroups = groups.filter(g => g.author.id !== me?.id)

  const openViewer = idx => {
    setStartIdx(idx)
    setViewerOpen(true)
  }

  const onFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video')
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error('File must be under 30 MB')
      return
    }
    createStory.mutate(file)
    e.target.value = ''
  }

  return (
    <>
      <div className="mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-1 py-2">
          {/* Own story / add */}
          <StoryRing
            user={me}
            hasUnviewed={false}
            isOwn
            onClick={() => {
              if (ownGroup?.stories?.length) {
                const idx = groups.findIndex(g => g.author.id === me?.id)
                openViewer(Math.max(0, idx))
              } else {
                fileRef.current?.click()
              }
            }}
          />
          {otherGroups.map((g, i) => {
            const realIdx = groups.findIndex(x => x.author.id === g.author.id)
            return (
              <StoryRing
                key={g.author.id}
                user={g.author}
                hasUnviewed={g.hasUnviewed}
                onClick={() => openViewer(realIdx)}
              />
            )
          })}
          {stories.isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-2.5 w-10 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFile}
      />

      <AnimatePresence>
        {viewerOpen && groups.length > 0 && (
          <StoryViewer
            groups={groups}
            startIndex={startIdx}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
