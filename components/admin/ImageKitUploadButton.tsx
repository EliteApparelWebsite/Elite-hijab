'use client'

import { useRef, useState } from 'react'

export function ImageKitUploadButton({
  onUploaded,
  onError,
  onUploadingChange,
  multiple = false,
  disabled = false,
  className,
  children,
}: {
  onUploaded: (url: string) => void
  onError?: (message: string) => void
  onUploadingChange?: (uploading: boolean) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    onUploadingChange?.(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/imagekit/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (res.ok && data.url) {
          onUploaded(data.url)
        } else {
          onError?.(data.error || 'Upload failed')
        }
      }
    } catch (err: any) {
      onError?.(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={className}
      >
        {children}
      </button>
    </>
  )
}
