'use client'

export default function ClientLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    </div>
  )
}
