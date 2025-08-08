'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { AlertDialog, ConfirmDialog, AlertType } from '@/components/ui/alert-dialog'

interface NotificationContextType {
  showAlert: (message: string, type?: AlertType, title?: string) => void
  showConfirm: (
    message: string,
    onConfirm: () => void,
    options?: {
      type?: AlertType
      title?: string
      confirmText?: string
      cancelText?: string
    }
  ) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean
    title?: string
    message: string
    type: AlertType
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  })

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title?: string
    message: string
    type: AlertType
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    message: '',
    type: 'warning'
  })

  const showAlert = (message: string, type: AlertType = 'info', title?: string) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      title
    })
  }

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    options?: {
      type?: AlertType
      title?: string
      confirmText?: string
      cancelText?: string
    }
  ) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm,
      type: options?.type || 'warning',
      title: options?.title,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText
    })
  }

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <NotificationContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Global Alert/Confirm Components */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm || (() => {})}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}