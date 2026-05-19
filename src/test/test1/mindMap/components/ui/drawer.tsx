'use client'

import type { FC, ReactNode } from 'react'
import * as React from 'react'
import { useCallback } from 'react'
import { Drawer as VaulDrawer } from 'vaul'
import { cn } from '@/utils/classnames'
import { RiCloseLine } from '@remixicon/react'

// ─────────────────────────── 默认导出：props 式简单用法 ───────────────────────────

type DrawerProps = {
  isShow: boolean
  onHide: () => void
  title?: string | ReactNode
  titleDescription?: string | ReactNode
  body?: ReactNode
  foot?: ReactNode
  /** 抽屉方向，默认 right */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 抽屉宽度类名，默认 !max-w-[480px] */
  panelClassName?: string
  /** 内容区类名 */
  contentClassName?: string
  /** header 区类名 */
  headerClassName?: string
}

const DrawerDefault: FC<DrawerProps> = ({
  isShow,
  onHide,
  title,
  titleDescription,
  body,
  foot,
  direction = 'right',
  panelClassName,
  contentClassName,
  headerClassName,
}) => {
  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen)
      onHide()
  }, [onHide])

  if (!isShow)
    return null

  return (
    <VaulDrawer.Root
      open={isShow}
      onOpenChange={handleClose}
      modal
      direction={direction}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-[1002] bg-black/20 backdrop-blur-[2px]" />
        <VaulDrawer.Content
          className={cn(
            'fixed z-[1002] flex flex-col bg-components-panel-bg',
            direction === 'right' && 'top-0 right-0 bottom-0 h-full',
            direction === 'left' && 'top-0 left-0 bottom-0 h-full',
            direction === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[10px]',
            direction === 'top' && 'inset-x-0 top-0 max-h-[85dvh] rounded-b-[10px]',
            direction === 'right' && 'w-full !max-w-[480px]',
            direction === 'left' && 'w-full !max-w-[480px]',
            panelClassName,
          )}
          style={direction === 'right' || direction === 'left' ? { boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)' } : undefined}
        >
          {/* Header */}
          {(title || titleDescription) && (
            <div className={cn('shrink-0 border-b border-divider-subtle py-4', headerClassName)}>
              <div className="flex h-6 items-center justify-between pl-6 pr-5">
                <div className="system-xl-semibold text-text-primary">
                  {title}
                </div>
                <div className="flex items-center">
                  <VaulDrawer.Close
                    className="flex h-6 w-6 cursor-pointer items-center justify-center"
                  >
                    <RiCloseLine className="h-4 w-4 text-text-tertiary" />
                  </VaulDrawer.Close>
                </div>
              </div>
              {titleDescription && (
                <div className="system-xs-regular pl-6 pr-10 text-text-tertiary">
                  {titleDescription}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          {body && (
            <div className={cn('grow overflow-y-auto', contentClassName)}>
              {body}
            </div>
          )}

          {/* Footer */}
          {foot && (
            <div className="shrink-0 border-t border-divider-subtle">
              {foot}
            </div>
          )}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}

export default React.memo(DrawerDefault)

// ─────────────────────────── 具名导出：复合组件 API ───────────────────────────

export const Drawer = VaulDrawer.Root
export const DrawerTrigger = VaulDrawer.Trigger
export const DrawerPortal = VaulDrawer.Portal
export const DrawerClose = VaulDrawer.Close
export const DrawerOverlay = VaulDrawer.Overlay

export const DrawerBackdrop = VaulDrawer.Overlay

export const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof VaulDrawer.Title>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Title>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-text-primary',
      className,
    )}
    {...props}
  />
))
DrawerTitle.displayName = 'DrawerTitle'

export const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof VaulDrawer.Description>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Description>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Description
    ref={ref}
    className={cn('text-sm text-text-tertiary', className)}
    {...props}
  />
))
DrawerDescription.displayName = 'DrawerDescription'

export const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof VaulDrawer.Content>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => (
  <VaulDrawer.Content
    ref={ref}
    className={cn(
      'fixed z-[1002] flex flex-col bg-components-panel-bg',
      className,
    )}
    {...props}
  >
    {children}
  </VaulDrawer.Content>
))
DrawerContent.displayName = 'DrawerContent'

/** DrawerViewport → 透传 div（vaul 不需要这层包装） */
export function DrawerViewport({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props}>{children}</div>
}

/** DrawerPopup → DrawerContent 的 alias */
export const DrawerPopup = DrawerContent

export function DrawerCloseButton({
  className,
  'aria-label': ariaLabel = 'Close',
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof VaulDrawer.Close>, 'children'>) {
  return (
    <VaulDrawer.Close
      aria-label={ariaLabel}
      {...props}
      className={cn(
        'flex h-5 w-5 cursor-pointer items-center justify-center rounded-2xl hover:bg-state-base-hover focus-visible:bg-state-base-hover focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span aria-hidden="true" className="i-ri-close-line h-4 w-4 text-text-tertiary" />
    </VaulDrawer.Close>
  )
}

export const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
)

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
)