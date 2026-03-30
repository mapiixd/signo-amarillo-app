export default function CardDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        <div className="h-6 w-48 bg-[#1A2332] rounded mb-6 animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] bg-[#1A2332] rounded-[40px] animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-[#1A2332] rounded-lg animate-pulse" />
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-[#1A2332] rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
