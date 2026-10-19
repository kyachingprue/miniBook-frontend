import { useState } from 'react'
import { Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/lib/usePwaInstall'

/** "Install app" button. Renders nothing when the app is already installed or not installable. */
export default function InstallAppButton({ className = '' }) {
  const { canInstall, showIosHint, install } = usePwaInstall()
  const [hint, setHint] = useState(false)

  if (!canInstall && !showIosHint) return null

  return (
    <div className={className}>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => (canInstall ? install() : setHint(h => !h))}
      >
        <Download className="h-4 w-4" />
        Install app
      </Button>
      {hint && (
        <p className="mt-2 flex items-center gap-1 px-1 text-xs text-neutral-500 dark:text-neutral-400">
          Tap <Share className="h-3 w-3" /> then “Add to Home Screen”.
        </p>
      )}
    </div>
  )
}
