'use client'

import { motion } from 'framer-motion'

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`skeleton-card rounded-2xl ${className}`}
    />
  )
}

function SkeletonText({ width = 'w-3/4', height = 'h-md' }: { width?: string; height?: string }) {
  return <span className={`skeleton-text ${width} ${height}`} />
}

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6"
    >
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="p-4 h-24 flex flex-col items-center justify-center gap-2">
            <span className="skeleton-text w-8 h-md" />
            <span className="skeleton-text w-3/4 h-lg" />
            <span className="skeleton-text w-1/2 h-sm" />
          </SkeletonCard>
        ))}
      </div>

      {/* Activity sparkline skeleton */}
      <SkeletonCard className="p-4 h-32">
        <div className="flex flex-col gap-3 p-2">
          <SkeletonText width="w-2/3" height="h-sm" />
          <div className="flex items-end gap-2 h-14">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-white/[0.04]"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        </div>
      </SkeletonCard>

      {/* Quick actions skeleton */}
      <div className="flex gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="rounded-full px-4 py-2.5 flex-shrink-0">
            <span className="skeleton-text w-20 h-sm" />
          </SkeletonCard>
        ))}
      </div>

      {/* Feature cards skeleton - 2x2 grid */}
      <div className="space-y-3">
        <SkeletonText width="w-1/3" height="h-sm" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-4 min-h-[100px]">
              <div className="flex flex-col gap-2 p-1">
                <span className="skeleton-text w-9 h-9 rounded-xl" />
                <SkeletonText width="w-3/4" height="h-sm" />
                <SkeletonText width="w-1/2" height="h-sm" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-2.5"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="rounded-xl p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SkeletonText width="w-1/2" height="h-md" />
              <SkeletonText width="w-1/4" height="h-sm" />
            </div>
            <div className="flex gap-2">
              <SkeletonText width="w-1/3" height="h-sm" />
              <SkeletonText width="w-1/4" height="h-sm" />
            </div>
            <span className="skeleton-text w-full h-[6px] rounded-full" />
          </div>
        </SkeletonCard>
      ))}
    </motion.div>
  )
}

export function CardSkeleton() {
  return (
    <SkeletonCard className="rounded-2xl p-4 min-h-[120px]">
      <div className="flex flex-col gap-2 p-1">
        <SkeletonText width="w-1/3" height="h-lg" />
        <SkeletonText width="w-3/4" height="h-sm" />
        <SkeletonText width="w-1/2" height="h-sm" />
      </div>
    </SkeletonCard>
  )
}

export { SkeletonCard, SkeletonText }
