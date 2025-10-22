import Link from 'next/link'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          {/* Logo de fondo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <img 
              src="/logo-icon.png" 
              alt="" 
              className="w-96 h-96 object-contain"
            />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-6xl font-bold mb-4 text-[#F4C430]">
              Constructor de Mazos Imperio
            </h1>
            <p className="text-lg text-[#4ECDC4] max-w-2xl mx-auto">
              En Carcosa, donde las leyendas cobran vida, forja tu imperio carta por carta.
              Explora el conocimiento prohibido del formato Imperio.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-8 text-center hover-glow transition-all">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-3 text-[#F4C430]">Colección de Cartas</h3>
            <p className="text-[#A0A0A0] mb-4">
              Explora todas las cartas disponibles en formato Imperio
            </p>
            <Link
              href="/cards"
              className="inline-block px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-all signo-glow-cyan"
            >
              Ver Cartas
            </Link>
          </div>

          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-8 text-center hover-glow transition-all">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold mb-3 text-[#F4C430]">Constructor de Barajas</h3>
            <p className="text-[#A0A0A0] mb-4">
              Crea y personaliza tus propias barajas
            </p>
            <Link
              href="/decks/new"
              className="inline-block px-6 py-3 bg-[#1A7F5A] text-white rounded-lg hover:bg-[#2D9B76] transition-all"
            >
              Crear Baraja
            </Link>
          </div>

          <div className="bg-[#121825] border border-[#2D9B96] rounded-xl shadow-lg p-8 text-center hover-glow transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-[#F4C430]">Mis Barajas</h3>
            <p className="text-[#A0A0A0] mb-4">
              Gestiona y organiza tus decks guardados
            </p>
            <Link
              href="/decks"
              className="inline-block px-6 py-3 bg-[#8B4789] text-white rounded-lg hover:bg-[#A864A8] transition-all"
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
