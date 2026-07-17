import React, { useRef } from 'react'
import { Camera } from 'lucide-react'

interface ReadingCaptureButtonProps {
  onImageSelected: (dataUrl: string) => void
  disabled?: boolean
}

export function ReadingCaptureButton({ onImageSelected, disabled }: ReadingCaptureButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        onImageSelected(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerPicker = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <>
      <button
        type="button"
        onClick={triggerPicker}
        disabled={disabled}
        className="absolute right-3.5 top-[23px] text-[#FF6600] hover:text-[#E65C00] hover:scale-105 active:scale-95 transition-all p-1.5 rounded-lg focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none z-10"
        title="Capture meter display image"
      >
        <Camera className="w-5 h-5" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </>
  )
}
export default ReadingCaptureButton
