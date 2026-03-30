export default function CardsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="h-8 w-64 bg-[#1A2332] rounded-lg mb-4 animate-pulse" />
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg p-4 sm:p-6 mb-4">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[#1A2332] rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-4 w-32 bg-[#1A2332] rounded animate-pulse" />
          </div>
          <div className="h-6 w-48 bg-[#121825] rounded-lg mb-6 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#1A2332] rounded-lg animate-pulse" style={{ animationDelay: `${i * 30}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
