import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Video, X, Link2, Upload } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/avatar'
import toast from 'react-hot-toast'

export default function PostComposer({ onPosted, autoFocus = false }) {
  const user = useSelector(s => s.auth.user)
  const qc = useQueryClient()
  const fileInputRef = useRef(null)

  const [text, setText] = useState('')
  const [image, setImage] = useState('') // final image URL
  const [imagePreview, setImagePreview] = useState('')
  const [videoPublicId, setVideoPublicId] = useState('')
  const [videoPreview, setVideoPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [visibility, setVisibility] = useState('PUBLIC')

  const mutation = useMutation({
    mutationFn: () =>
      api.createPost({
        text: text.trim(),
        visibility,
        ...(image.trim() ? { image: image.trim() } : {}),
        ...(videoPublicId ? { videoPublicId } : {})
      }),
    onSuccess: async () => {
      setText('')
      setImage('')
      setImagePreview('')
      setVideoPublicId('')
      setVideoPreview('')
      await qc.invalidateQueries({ queryKey: ['feed'] })
      await qc.invalidateQueries({ queryKey: ['profile-posts'] })
      onPosted?.()
      toast.success('Post created')
    },
    onError: err => {
      toast.error(err.message || 'Failed to create post')
    }
  })

  // Local image → ImgBB → URL
  const uploadImageFile = async file => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be 8 MB or smaller')
      return
    }

    // local preview
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
    setUploadingImage(true)
    setVideoPublicId('')
    setVideoPreview('')

    try {
      // file → base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          // data:image/png;base64,xxxx → শুধু base64 অংশ
          const pure = String(result).split(',')[1]
          resolve(pure)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const result = await api.uploadToImgBB(base64)
      const url = result.url || result.displayUrl
      if (!url) throw new Error('No URL returned from ImgBB')

      setImage(url)
      setImagePreview(url)
      toast.success('Image uploaded')
    } catch (err) {
      setImage('')
      setImagePreview('')
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const uploadVideo = async file => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file')
      return
    }
    setVideoPreview(URL.createObjectURL(file))
    setUploading(true)
    setImage('')
    setImagePreview('')
    try {
      const signed = await api.videoUploadSignature()
      if (file.size > signed.maxFileMB * 1024 * 1024) {
        throw new Error(`Video must be smaller than ${signed.maxFileMB} MB.`)
      }
      const body = new FormData()
      Object.entries(signed.fields).forEach(([k, v]) =>
        body.append(k, String(v))
      )
      body.append('file', file)
      const response = await fetch(signed.uploadUrl, { method: 'POST', body })
      const result = await response.json()
      if (!response.ok || !result.public_id) {
        throw new Error(result.error?.message || 'Video upload failed')
      }
      setVideoPublicId(result.public_id)
      toast.success('Video uploaded successfully')
    } catch (error) {
      setVideoPreview('')
      toast.error(error.message || 'Video upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    setImage('')
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!user) return null

  const isBusy = mutation.isPending || uploading || uploadingImage

  return (
    <Card className="mb-4 p-4">
      <div className="flex gap-3">
        <UserAvatar user={user} className="h-11 w-11" />
        <div className="flex-1">
          <Textarea
            autoFocus={autoFocus}
            value={text}
            maxLength={500}
            onChange={e => setText(e.target.value)}
            placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          />

          {/* Image URL input */}
          <div className="mt-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 shrink-0 text-brand-600" />
            <Input
              value={image}
              onChange={e => {
                setImage(e.target.value)
                setImagePreview(e.target.value)
                if (e.target.value.trim()) {
                  setVideoPublicId('')
                  setVideoPreview('')
                }
              }}
              placeholder="Image URL (optional)"
              aria-label="Image URL"
              disabled={uploadingImage || Boolean(videoPublicId)}
            />
          </div>

          {/* Local image + Video buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800">
              <Upload className="h-4 w-4 text-brand-600" />
              {uploadingImage ? 'Uploading…' : 'Upload image'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={isBusy || Boolean(videoPublicId)}
                onChange={e => uploadImageFile(e.target.files?.[0])}
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-800">
              <Video className="h-4 w-4 text-brand-600" />
              Add video
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                className="hidden"
                disabled={isBusy || Boolean(image.trim())}
                onChange={e => uploadVideo(e.target.files?.[0])}
              />
            </label>

            {uploading && (
              <span className="text-xs text-brand-600">Uploading video…</span>
            )}
            {videoPublicId && (
              <span className="text-xs text-emerald-600">Video uploaded ✓</span>
            )}
            {image && !uploadingImage && (
              <span className="text-xs text-emerald-600">Image ready ✓</span>
            )}
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-3">
              <img
                src={imagePreview}
                alt="Post preview"
                className="max-h-64 w-full rounded-xl object-cover"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Video preview */}
          {videoPreview && (
            <div className="relative mt-3">
              <video
                src={videoPreview}
                controls
                className="max-h-64 w-full rounded-xl bg-black"
              />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                onClick={() => {
                  setVideoPublicId('')
                  setVideoPreview('')
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {text.length}/500
              </span>

              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 outline-none transition-colors focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                title="Who can see this post"
              >
                <option
                  value="PUBLIC"
                  className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white"
                >
                  Public
                </option>

                <option
                  value="FRIENDS"
                  className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white"
                >
                  Friends
                </option>

                <option
                  value="PRIVATE"
                  className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white"
                >
                  Only me
                </option>
              </select>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                isBusy || (!text.trim() && !image.trim() && !videoPublicId)
              }
            >
              <Send className="h-4 w-4" />
              {uploading || uploadingImage
                ? 'Uploading…'
                : mutation.isPending
                  ? 'Posting…'
                  : 'Post'}
            </Button>
          </div>

          {mutation.isError && (
            <p className="mt-2 text-sm text-red-500">
              {mutation.error.message}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
