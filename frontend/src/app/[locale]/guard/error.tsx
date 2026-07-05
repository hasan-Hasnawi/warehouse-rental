'use client'

export default function GuardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <p className="text-red-500 text-lg font-semibold">حدث خطأ</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
