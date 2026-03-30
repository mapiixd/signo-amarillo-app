export default function DeckViewLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="h-6 w-32 bg-[#1A2332] rounded mb-4 animate-pulse" />
        <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden mb-6">
          <div className="bg-[#1A2332] p-6 min-h-[140px]">
            <div className="h-8 w-64 bg-[#121825] rounded mb-3 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-20 bg-[#121825] rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-[#2D9B96]">
            <div className="p-4 text-center border-r border-[#2D9B96]">
              <div className="h-8 w-12 bg-[#1A2332] rounded mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-[#1A2332] rounded mx-auto animate-pulse" />
            </div>
            <div className="p-4 text-center">
              <div className="h-8 w-12 bg-[#1A2332] rounded mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-[#1A2332] rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2.5/3.5] bg-[#1A2332] rounded-lg animate-pulse" style={{ animationDelay: `${i * 25}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
