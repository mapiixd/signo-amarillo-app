'use client'

import { useEffect, useState } from 'react'

export default function TestCookiePage() {
  const [cookieInfo, setCookieInfo] = useState<string>('')
  const [apiResult, setApiResult] = useState<any>(null)
  const [debugResult, setDebugResult] = useState<any>(null)

  const checkCookies = () => {
    // Ver todas las cookies del navegador
    setCookieInfo(document.cookie)
    
    // Probar la API /me
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setApiResult(data))
      .catch(err => setApiResult({ error: err.message }))

    // Probar la API de debug
    fetch('/api/debug/cookies', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setDebugResult(data))
      .catch(err => setDebugResult({ error: err.message }))
  }

  useEffect(() => {
    checkCookies()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test de Cookies</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Cookies del Navegador:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {cookieInfo || 'No hay cookies visibles (esperado para httpOnly cookies)'}
          </pre>
          <p className="mt-2 text-sm text-gray-600">
            Nota: Las cookies con httpOnly=true no son visibles aquí, lo cual es correcto.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Debug de Cookies (Servidor):</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-3">Resultado de /api/auth/me:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={checkCookies}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            🔄 Refrescar
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ← Volver al inicio
          </button>
          <button
            onClick={() => window.location.href = '/decks/new'}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            🎴 Ir a Constructor
          </button>
        </div>
      </div>
    </div>
  )
}

