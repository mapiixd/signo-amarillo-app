import Link from 'next/link'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="flex-1 container mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 relative">
          {/* Logo de fondo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <img 
              src="/logo-icon.png" 
              alt="" 
              className="w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 object-contain"
            />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-[#F4C430] px-4">
              Constructor de Mazos Imperio
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#4ECDC4] max-w-2xl mx-auto px-4">
              En Carcosa, donde las leyendas cobran vida, forja tu imperio carta por carta.
              Explora el conocimiento prohibido del formato Imperio.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-6 sm:p-8 text-center hover-glow transition-all">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📚</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[#F4C430]">Colección de Cartas</h3>
            <p className="text-sm sm:text-base text-[#A0A0A0] mb-4">
              Explora todas las cartas disponibles en formato Imperio
            </p>
            <Link
              href="/cards"
              className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-[#2D9B96] text-white text-sm sm:text-base rounded-lg hover:bg-[#4ECDC4] transition-all signo-glow-cyan"
            >
              Ver Cartas
            </Link>
          </div>

          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-6 sm:p-8 text-center hover-glow transition-all">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🛠️</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[#F4C430]">Constructor de Barajas</h3>
            <p className="text-sm sm:text-base text-[#A0A0A0] mb-4">
              Crea y personaliza tus propias barajas
            </p>
            <Link
              href="/decks/format-select"
              className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-[#1A7F5A] text-white text-sm sm:text-base rounded-lg hover:bg-[#2D9B76] transition-all"
            >
              Crear Baraja
            </Link>
          </div>

          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-6 sm:p-8 text-center hover-glow transition-all sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[#F4C430]">Mis Barajas</h3>
            <p className="text-sm sm:text-base text-[#A0A0A0] mb-4">
              Gestiona y organiza tus decks guardados
            </p>
            <Link
              href="/decks"
              className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-[#8B4789] text-white text-sm sm:text-base rounded-lg hover:bg-[#A864A8] transition-all"
            >
              Ver Barajas
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
