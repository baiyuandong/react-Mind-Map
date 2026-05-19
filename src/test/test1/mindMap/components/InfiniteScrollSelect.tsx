'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/base/ui/select'
import type { SystemItem } from '@/models/knowledgeSystem'
import { useEffect, useRef } from 'react'
import { cn } from '@/utils/classnames'

type InfiniteScrollSelectProps = {
  systems: SystemItem[]
  selectedId: string
  onSelect: (id: string) => void
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  placeholder?: string
  className?: string
}

export function InfiniteScrollSelect({
  systems = [],
  selectedId,
  onSelect,
  hasMore,
  isLoading,
  onLoadMore,
  placeholder = '请选择知识体系',
  className,
}: InfiniteScrollSelectProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '40px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  const selectedName = systems.find(s => s.id === selectedId)?.name || ''

  const handleValueChange = (value: string | null) => {
    if (value) onSelect(value)
  }

  return (
    <Select value={selectedId} onValueChange={handleValueChange}>
      <SelectTrigger
        className={cn('min-w-[200px]', className)}
        aria-label="知识体系选择"
      >
        <SelectValue placeholder={placeholder}>
          {selectedName || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent listClassName="max-h-60">
        {systems.map(system => (
          <SelectItem key={system.id} value={system.id}>
            {system.name}
          </SelectItem>
        ))}

        {/* 当它出现在视口中时触发加载更多 */}
        {hasMore && (
          <div ref={sentinelRef} className="flex h-8 items-center justify-center text-text-tertiary system-xs-regular">
            {isLoading ? '加载中...' : ''}
          </div>
        )}

        {!hasMore && systems.length > 0 && (
          <div className="flex h-8 items-center justify-center text-text-tertiary system-xs-regular">
            已加载全部
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

