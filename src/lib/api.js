const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '')
let accessToken = null
// Refresh token is also kept in localStorage: the httpOnly cookie is cross-site (Vercel -> API domain)
// and browsers often block it, which logged the user out on every reload.
const RT_KEY = 'mb_refresh_token'
const getRefreshToken = () => {
  try {
    return localStorage.getItem(RT_KEY)
  } catch {
    return null
  }
}
const setRefreshToken = token => {
  try {
    if (token) localStorage.setItem(RT_KEY, token)
    else localStorage.removeItem(RT_KEY)
  } catch {
    /* storage unavailable */
  }
}
export const setAccessToken = token => {
  accessToken = token || null
}
export const getAccessToken = () => accessToken

async function request(path, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Client': 'mobile', // backend then also returns the refresh token in the JSON body
    ...(options.headers || {})
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    })
  } catch {
    throw new Error(`Cannot connect to server. Check API URL: ${API_BASE}`)
  }
  let body = {}
  try {
    body = await response.json()
  } catch {
    /* empty response */
  }
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession().catch(() => false)
    if (refreshed) return request(path, options, false)
  }
  if (!response.ok || body.success === false) {
    const error = new Error(
      body.message ||
        body.error?.message ||
        `Request failed (${response.status})`
    )
    error.status = response.status
    error.code = body.code || body.error?.code
    throw error
  }
  return body
}
const json = (method, data) => ({ method, body: JSON.stringify(data) })
let refreshing = null
export function refreshSession() {
  // One refresh at a time (StrictMode / parallel queries would otherwise rotate the token twice)
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const result = await request(
          '/auth/refresh',
          json('POST', { refreshToken: getRefreshToken() || undefined }),
          false
        )
        setAccessToken(result.data?.accessToken)
        if (result.data?.refreshToken) setRefreshToken(result.data.refreshToken)
        return Boolean(result.data?.accessToken)
      } catch (err) {
        if (err.status === 401) setRefreshToken(null) // only drop it when the server rejects it
        throw err
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

export const api = {
  async adminOverview() {
    return (await request('/admin/overview')).data
  },
  async adminAnalytics(params = {}) {
    const q = new URLSearchParams(params)
    return (await request(`/admin/analytics?${q}`)).data
  },
  async adminUsers(params = {}) {
    const q = new URLSearchParams(params)
    return (await request(`/admin/users?${q}`)).data
  },
  async adminUser(id) {
    return (await request(`/admin/users/${encodeURIComponent(id)}`)).data
  },
  async adminSetUserStatus(id, isActive) {
    return (
      await request(
        `/admin/users/${encodeURIComponent(id)}/status`,
        json('PATCH', { isActive })
      )
    ).data
  },
  async adminDeleteUser(id) {
    return request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },
  async adminPosts(params = {}) {
    const q = new URLSearchParams(params)
    return (await request(`/admin/posts?${q}`)).data
  },
  async adminDeletePost(id) {
    return request(`/admin/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },
  async session() {
    if (!accessToken) {
      try {
        await refreshSession()
      } catch {
        return null
      }
    }
    try {
      const result = await request('/auth/me')
      return result.data || null
    } catch {
      setAccessToken(null)
      try {
        await refreshSession()
        const result = await request('/auth/me', {}, false)
        return result.data || null
      } catch {
        setAccessToken(null)
        return null
      }
    }
  },
  async login(data) {
    const r = await request('/auth/login', json('POST', data), false)
    setAccessToken(r.data.accessToken)
    setRefreshToken(r.data.refreshToken)
    return r.data
  },
  async register(data) {
    return request('/auth/register', json('POST', data), false)
  },
  async verifyEmail(data) {
    const r = await request('/auth/verify-email', json('POST', data), false)
    setAccessToken(r.data.accessToken)
    setRefreshToken(r.data.refreshToken)
    return r.data
  },
  async resendCode(data) {
    return request('/auth/resend-code', json('POST', data), false)
  },
  async logout() {
    try {
      await request(
        '/auth/logout',
        json('POST', { refreshToken: getRefreshToken() || undefined }),
        false
      )
    } finally {
      setAccessToken(null)
      setRefreshToken(null)
    }
  },
  async feed(params = {}) {
    const q = new URLSearchParams({ limit: '20', ...params })
    return (await request(`/posts?${q}`)).data || []
  },
  async post(id) {
    return (await request(`/posts/${encodeURIComponent(id)}`)).data
  },
  async createPost(data) {
    return (await request('/posts', json('POST', data))).data
  },
  async deletePost(id) {
    return request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  async likePost(post) {
    return (
      await request(
        `/posts/${post.id}/like`,
        json(post.liked ? 'DELETE' : 'POST', {})
      )
    ).data
  },
  async bookmarkPost(post) {
    return (
      await request(
        `/posts/${post.id}/bookmark`,
        json(post.bookmarked ? 'DELETE' : 'POST', {})
      )
    ).data
  },
  async sharePost(id) {
    return (await request(`/posts/${id}/share`, json('POST', {}))).data
  },
  async comments(id) {
    return (await request(`/posts/${id}/comments?limit=50`)).data || []
  },
  async addComment(id, text, parentId) {
    return (
      await request(
        `/posts/${id}/comments`,
        json('POST', { text, ...(parentId ? { parentId } : {}) })
      )
    ).data
  },
  async profile(username) {
    return (await request(`/users/${encodeURIComponent(username)}`)).data
  },
  async profilePosts(username) {
    return (
      (await request(`/users/${encodeURIComponent(username)}/posts?limit=20`))
        .data || []
    )
  },
  async updateProfile(data) {
    return (await request('/users/me', json('PATCH', data))).data
  },
  async follow(username, following) {
    return request(`/users/${encodeURIComponent(username)}/follow`, {
      method: following ? 'DELETE' : 'POST'
    })
  },
  async searchUsers(q) {
    return (
      (await request(`/users/search?q=${encodeURIComponent(q)}`)).data || []
    )
  },
  async trending() {
    return (await request('/posts/trending')).data || []
  },
  async bookmarks() {
    return (await request('/posts/bookmarks?limit=20')).data || []
  },
  async suggestions() {
    return (await request('/users/suggestions')).data || []
  },
  async notifications() {
    return (await request('/notifications?limit=30')).data || []
  },
  async unreadNotificationCount() {
    return (await request('/notifications/unread-count')).data?.count || 0
  },
  async markNotificationRead(id) {
    return request(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH'
    })
  },
  async deleteNotification(id) {
    return request(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },
  async followers(username) {
    return (
      (
        await request(
          `/users/${encodeURIComponent(username)}/followers?limit=50`
        )
      ).data || []
    )
  },
  async following(username) {
    return (
      (
        await request(
          `/users/${encodeURIComponent(username)}/following?limit=50`
        )
      ).data || []
    )
  },
  async updatePost(id, data) {
    return (
      await request(`/posts/${encodeURIComponent(id)}`, json('PATCH', data))
    ).data
  },
  async markAllNotificationsRead() {
    return request('/notifications/read-all', { method: 'PATCH' })
  },
  async clearNotifications() {
    return request('/notifications', { method: 'DELETE' })
  },
  async communities() {
    return (await request('/communities')).data || []
  },
  async joinCommunity(id, joined) {
    return request(`/communities/${id}/join`, {
      method: joined ? 'DELETE' : 'POST'
    })
  },
  async events() {
    return (await request('/events')).data || []
  },
  async attendEvent(id, going) {
    return request(`/events/${id}/going`, {
      method: going ? 'DELETE' : 'POST'
    })
  },
  async conversations() {
    return (await request('/messages/conversations')).data || []
  },
  async startConversation(username) {
    return (
      await request('/messages/conversations', json('POST', { username }))
    ).data
  },
  async messages(id) {
    return (
      (await request(`/messages/conversations/${id}/messages?limit=50`)).data ||
      []
    )
  },
  async videoUploadSignature() {
    return (await request('/uploads/video-signature', json('POST', {}))).data
  },
  async imageUploadSignature() {
    return (await request('/uploads/image-signature', json('POST', {}))).data
  },
  async sendMessage(id, text) {
    return (
      await request(
        `/messages/conversations/${id}/messages`,
        json('POST', { text })
      )
    ).data
  },

  // Stories
  async stories() {
    return (await request('/stories')).data || []
  },
  async createStory(data) {
    return (await request('/stories', json('POST', data))).data
  },
  async viewStory(id) {
    return request(`/stories/${encodeURIComponent(id)}/view`, json('POST', {}))
  },
  async deleteStory(id) {
    return request(`/stories/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  async uploadToImgBB(imageBase64) {
    return (await request('/uploads/imgbb', json('POST', { imageBase64 }))).data
  },

  // Follow enhancements
  async myFollowing() {
    return (await request('/users/me/following')).data || []
  },
  async myFollowers() {
    return (await request('/users/me/followers')).data || []
  },
  async pendingRequests() {
    return (await request('/users/me/requests')).data || []
  },
  async acceptRequest(username) {
    return request(
      `/users/${encodeURIComponent(username)}/accept`,
      json('POST', {})
    )
  },
  async rejectRequest(username) {
    return request(
      `/users/${encodeURIComponent(username)}/reject`,
      json('POST', {})
    )
  },
  async cancelRequest(username) {
    return request(`/users/${encodeURIComponent(username)}/request`, {
      method: 'DELETE'
    })
  },
  async removeFollower(username) {
    return request(`/users/${encodeURIComponent(username)}/follower`, {
      method: 'DELETE'
    })
  },
  async updatePrivacy(privacy) {
    return (await request('/users/me/privacy', json('PATCH', { privacy }))).data
  },
  async messageableUsers() {
    return (await request('/users/me/messageable')).data || []
  },
  async unreadMessageCount() {
    return (await request('/messages/unread-count')).data?.count || 0
  },
  async markConversationRead(id) {
    return request(`/messages/conversations/${encodeURIComponent(id)}/read`, {
      method: 'PATCH'
    })
  }
}

export function normalizePost(post) {
  if (!post) return post
  return {
    ...post,
    author: post.author || {},
    image: post.image || null,
    video: post.video || null,
    likes: post.likesCount ?? post.likes ?? 0,
    commentsCount: post.commentsCount ?? 0,
    shares: post.sharesCount ?? post.shares ?? 0,
    comments: post.comments || [],
    liked: Boolean(post.liked),
    bookmarked: Boolean(post.bookmarked),
    createdAt: post.createdAt ? new Date(post.createdAt).getTime() : Date.now()
  }
}

export function normalizeComment(comment) {
  return {
    ...comment,
    user: comment.author || comment.user || {},
    createdAt: comment.createdAt
      ? new Date(comment.createdAt).getTime()
      : Date.now()
  }
}
