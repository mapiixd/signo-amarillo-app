export default function NewDeckLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6">
        <div className="h-6 w-40 bg-[#1A2332] rounded mb-4 animate-pulse" />
        <div className="h-8 w-72 bg-[#1A2332] rounded mb-6 animate-pulse" />
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg p-6">
            <div className="h-12 bg-[#1A2332] rounded-lg mb-4 animate-pulse" />
            <div className="h-12 bg-[#1A2332] rounded-lg mb-4 animate-pulse" />
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-16 bg-[#1A2332] rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[50vh] overflow-hidden">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="aspect-[2.5/3.5] bg-[#1A2332] rounded-lg animate-pulse" style={{ animationDelay: `${i * 20}ms` }} />
              ))}
            </div>
          </div>
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg p-6">
            <div className="h-12 bg-[#1A2332] rounded-lg mb-4 animate-pulse" />
            <div className="flex gap-2 mb-4">
              <div className="flex-1 h-10 bg-[#1A2332] rounded-lg animate-pulse" />
              <div className="flex-1 h-10 bg-[#1A2332] rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-[#1A2332] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
