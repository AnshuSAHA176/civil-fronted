import { Heart } from 'lucide-react'
import { Button } from '../common/Button'

export default function LikeButton({ liked, count, loading, onClick, compact = false }) {
  return (
    <Button
      variant={liked ? 'primary' : 'secondary'}
      className={`complaint-like-button${liked ? ' is-liked' : ''}${compact ? ' is-compact' : ''}`}
      onClick={onClick}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike this complaint' : 'Like this complaint'}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
      <span>{liked ? 'Liked' : 'Like'}</span>
      <span className="complaint-like-count">{Number(count || 0)}</span>
    </Button>
  )
}
