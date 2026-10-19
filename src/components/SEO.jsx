import { Helmet } from 'react-helmet-async'

export default function SEO({
  title,
  description = 'MiniBook — connect, share and discover.'
}) {
  const full = title ? `${title} • MiniBook` : 'MiniBook'
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Helmet>
  )
}
