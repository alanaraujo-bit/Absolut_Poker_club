export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  return (
    <div className={`spinner-poker ${sizeClasses[size]} ${className}`} />
  )
}

export function LoadingCard() {
  return (
    <div className="poker-card animate-pulse">
      <div className="h-6 bg-primary/10 rounded w-3/4 mb-4" />
      <div className="h-4 bg-primary/10 rounded w-1/2 mb-2" />
      <div className="h-4 bg-primary/10 rounded w-2/3" />
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 mx-auto">
            <LoadingSpinner size="lg" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-pulse-gold">♠️</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold gold-text animate-pulse">Carregando...</h2>
          <p className="text-sm text-muted-foreground mt-1">Absolut Poker Club</p>
        </div>
      </div>
    </div>
  )
}

export function LoadingTable() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg glass-poker animate-pulse">
          <div className="h-4 bg-primary/10 rounded flex-1" />
          <div className="h-4 bg-primary/10 rounded w-24" />
          <div className="h-4 bg-primary/10 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

export function LoadingOverlay({ message = 'Processando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-poker rounded-xl p-6 text-center space-y-4 max-w-sm mx-4">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="text-lg font-semibold gold-text">{message}</p>
      </div>
    </div>
  )
}
