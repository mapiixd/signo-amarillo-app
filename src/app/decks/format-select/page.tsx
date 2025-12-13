'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

type Format = 'racial' | null
type Race = 'Bestia' | 'Caballero' | 'Dragón' | 'Eterno' | 'Faerie' | 'Guerrero' | 'Héroe' | 'Sacerdote' | 'Sombra' | null

export default function FormatSelectPage() {
  const router = useRouter()
  const [selectedFormat, setSelectedFormat] = useState<Format>(null)
  const [selectedRace, setSelectedRace] = useState<Race>(null)

  useEffect(() => {
    document.title = 'Elegir Formato | El Signo Amarillo';
  }, [])

  const races: Array<{ name: Race, image: string }> = [
    { name: 'Bestia', image: '/razas/Bestia.png' },
    { name: 'Caballero', image: '/razas/Caballero.png' },
    { name: 'Dragón', image: '/razas/Dragón.png' },
    { name: 'Eterno', image: '/razas/Eterno.png' },
    { name: 'Faerie', image: '/razas/Fairie.png' },
    { name: 'Guerrero', image: '/razas/Guerrero.png' },
    { name: 'Héroe', image: '/razas/Héroe.png' },
    { name: 'Sacerdote', image: '/razas/Sacerdote.png' },
    { name: 'Sombra', image: '/razas/Sombra.png' }
  ]

  const handleContinue = () => {
    if (selectedFormat === 'racial' && selectedRace) {
      router.push(`/decks/new?race=${encodeURIComponent(selectedRace)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#2D9B96] hover:text-[#4ECDC4] mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2">
            Crear Nueva Baraja
          </h1>
          <p className="text-[#A0A0A0]">
            Selecciona el formato y la raza para construir tu mazo
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Paso 1: Seleccionar Formato */}
          <div className="mb-8">
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  selectedFormat ? 'bg-[#2D9B96] text-white' : 'bg-[#1A2332] text-[#F4C430]'
                }`}>
                  1
                </div>
                <h2 className="text-2xl font-bold text-[#F4C430]">
                  Seleccionar Formato
                </h2>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setSelectedFormat('racial')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedFormat === 'racial'
                      ? 'bg-[#2D9B96]/20 border-[#2D9B96] shadow-lg'
                      : 'bg-[#1A2332] border-[#2D9B96]/50 hover:border-[#2D9B96]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏆</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#F4C430] mb-2">
                        Imperio Racial
                      </h3>
                      <p className="text-[#E8E8E8] mb-2">
                        Construye tu mazo enfocándote en una raza específica de aliados.
                      </p>
                      <div className="text-[#2D9B96] text-sm">
                        • 50 cartas en el mazo principal<br/>
                        • 15 cartas en el mazo de refuerzo (opcional)<br/>
                        • Mínimo 17 cartas entre Aliados, Armas y Tótems<br/>
                        • Solo aliados de una raza específica<br/>
                        • Máximo 4 aliados sin raza (solo en el mazo principal)
                      </div>
                    </div>
                    {selectedFormat === 'racial' && (
                      <div className="text-[#2D9B96] text-2xl">✓</div>
                    )}
                  </div>
                </button>

                {/* Próximamente - Tríadas */}
                <div className="p-6 rounded-lg border-2 border-[#2D9B96]/30 bg-[#1A2332]/50 opacity-50">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔒</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#A0A0A0] mb-2">
                        Tríadas
                      </h3>
                      <p className="text-[#707070] mb-2">
                        Construye tu mazo en una de las 3 facciones.
                      </p>
                      <div className="text-[#707070] text-sm">
                        <strong>Tenebris:</strong> Bestia, Dragón, Sombra<br/>
                        <strong>Paladín:</strong> Caballero, Guerrero, Héroe<br/>
                        <strong>Desafiante:</strong> Eterno, Faerie, Sacerdote<br/>
                        <br/>
                        Próximamente...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Próximamente - Imperio VCR */}
                <div className="p-6 rounded-lg border-2 border-[#2D9B96]/30 bg-[#1A2332]/50 opacity-50">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔒</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#A0A0A0] mb-2">
                        Imperio VCR
                      </h3>
                      <p className="text-[#707070] mb-2">
                        Formato Vasallo, Cortesano y Real - construye tu mazo con restricciones de rareza.
                      </p>
                      <div className="text-[#707070] text-sm">
                        Próximamente...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 2: Seleccionar Raza (solo visible si se seleccionó formato) */}
          {selectedFormat === 'racial' && (
            <div className="mb-8 animate-fade-in">
              <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    selectedRace ? 'bg-[#2D9B96] text-white' : 'bg-[#1A2332] text-[#F4C430]'
                  }`}>
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-[#F4C430]">
                    Seleccionar Raza
                  </h2>
                </div>

                <p className="text-[#A0A0A0] mb-6 text-sm sm:text-base">
                  Elige la raza que definirá los aliados de tu mazo
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {races.map((race) => (
                    <button
                      key={race.name}
                      onClick={() => setSelectedRace(race.name)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left hover:scale-105 relative overflow-hidden ${
                        selectedRace === race.name
                          ? 'bg-[#2D9B96]/20 border-[#2D9B96] shadow-lg shadow-[#2D9B96]/50'
                          : 'bg-[#1A2332] border-[#2D9B96]/50 hover:border-[#2D9B96]'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* Imagen de la raza */}
                         <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mb-2 sm:mb-3 rounded-full overflow-hidden border-2 border-[#2D9B96] flex items-center justify-center bg-[#0A0E1A]">
                           <img
                             src={race.image}
                             alt={race.name || ''}
                             className={`w-full h-full object-cover ${
                               race.name && ['Héroe', 'Sacerdote', 'Sombra', 'Dragón'].includes(race.name) 
                                 ? 'object-top' 
                                 : 'object-center'
                             }`}
                           />
                         </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#F4C430]">
                          {race.name}
                        </h3>
                        {selectedRace === race.name && (
                          <div className="absolute top-2 right-2 bg-[#2D9B96] text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-base sm:text-xl">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botón Continuar */}
          {selectedFormat === 'racial' && selectedRace && (
            <div className="flex justify-center animate-fade-in">
              <button
                onClick={handleContinue}
                className="px-8 py-4 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-all font-bold text-lg shadow-lg hover:shadow-xl"
              >
                Continuar al Constructor de Mazos →
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

