import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🃏 Decks Imperio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestiona tus barajas de Mitos y Leyendas en formato Imperio.
            Crea, edita y comparte tus mejores decks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-3">Colección de Cartas</h3>
            <p className="text-gray-600 mb-4">
              Explora todas las cartas disponibles en formato Imperio
            </p>
            <Link
              href="/cards"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Cartas
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold mb-3">Constructor de Barajas</h3>
            <p className="text-gray-600 mb-4">
              Crea y personaliza tus propias barajas
            </p>
            <Link
              href="/decks/new"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear Baraja
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Mis Barajas</h3>
            <p className="text-gray-600 mb-4">
              Gestiona y organiza tus decks guardados
            </p>
            <Link
              href="/decks"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Barajas
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-3">Administración</h3>
            <p className="text-gray-600 mb-4">
              Gestiona cartas y datos del formato Imperio
            </p>
            <Link
              href="/admin/cards"
              className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Panel Admin
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            ¿Qué es el formato Imperio?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Características principales:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Barajas de 60 cartas mínimas</li>
                <li>• Sin límite de copias por carta</li>
                <li>• Cartas de todas las expansiones permitidas</li>
                <li>• Énfasis en estrategia y sinergia</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Objetivos del formato:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Crear decks competitivos y divertidos</li>
                <li>• Explorar estrategias innovadoras</li>
                <li>• Compartir conocimiento con la comunidad</li>
                <li>• Evolución continua del meta</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
