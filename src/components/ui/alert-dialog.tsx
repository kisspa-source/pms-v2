'use client'

import { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: AlertType
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: AlertType
}

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const alertColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
}

export function AlertDialog({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}: AlertDialogProps) {
  const Icon = alertIcons[type]
  const iconColor = alertColors[type]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        
        {title && (
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>
        )}
        
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
          {message}
        </p>
        
        <Button onClick={onClose} className="w-full">
          확인
        </Button>
      </div>
    </Modal>
  )
}

export function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = '확인',
  cancelText = '취소',
  type = 'warning'
}: ConfirmDialogProps) {
  const Icon = alertIcons[type]
  const iconColor = alertColors[type]

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        
        {title && (
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>
        )}
        
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 order-1 sm:order-2"
            variant={type === 'error' ? 'destructive' : 'default'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Hook for easier usage
export function useAlert() {
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

  const AlertComponent = () => (
    <AlertDialog
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
    />
  )

  return {
    showAlert,
    AlertComponent
  }
}

export function useConfirm() {
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

  const ConfirmComponent = () => (
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
  )

  return {
    showConfirm,
    ConfirmComponent
  }
}