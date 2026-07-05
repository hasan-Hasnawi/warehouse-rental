'use client'

export default function GuardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    </div>
  )
}
