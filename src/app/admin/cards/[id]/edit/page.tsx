'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SupabaseCard, CARD_TYPE_LABELS, RARITY_TYPE_LABELS, RACES, EXPANSION_TO_PATH } from '@/types'
import Swal from 'sweetalert2'
import { getCardFullImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'

// Configuración de estilos para SweetAlert2
const swalConfig = {
  background: '#121825',
  color: '#E8E8E8',
  confirmButtonColor: '#F4C430',
  cancelButtonColor: '#2D9B96',
  customClass: {
    popup: 'border-2 border-[#2D9B96]',
    title: 'text-[#F4C430]',
    htmlContainer: 'text-[#E8E8E8]'
  }
}

interface CardFormData {
  name: string
  type: string
  cost: string
  attack: string
  description: string
  imageUrl: string
  imageFile: string
  rarity: string
  expansion: string
  race: string[]
  isActive: boolean
}

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  useEffect(() => {
    document.title = 'Editar Carta | El Signo Amarillo';
  }, [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expansions, setExpansions] = useState<string[]>([])
  const [expansionsLoading, setExpansionsLoading] = useState(true)
  const [card, setCard] = useState<SupabaseCard | null>(null)
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    type: 'ALIADO',
    cost: '',
    attack: '',
    description: '',
    imageUrl: '',
    imageFile: '',
    rarity: 'COMUN',
    expansion: '',
    race: [],
    isActive: false
  })

  useEffect(() => {
    fetchExpansions()
    fetchCard()
  }, [id])

  const fetchExpansions = async () => {
    try {
      const response = await fetch('/api/admin/cards/expansions')
      if (response.ok) {
        const data = await response.json()
        setExpansions(data.expansions)
      }
    } catch (error) {
      console.error('Error fetching expansions:', error)
    } finally {
      setExpansionsLoading(false)
    }
  }

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/admin/cards/${id}`)
      if (response.ok) {
        const cardData = await response.json()
        setCard(cardData)
        // Parsear las razas correctamente
        let races: string[] = []
        if (cardData.race) {
          races = cardData.race.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0)
        }

        setFormData({
          name: cardData.name || '',
          type: cardData.type || 'ALIADO',
          cost: cardData.cost !== null ? cardData.cost.toString() : '',
          attack: cardData.attack !== null ? cardData.attack.toString() : '',
          description: cardData.description || '',
          imageUrl: cardData.image_url || '',
          imageFile: cardData.image_file || '',
          rarity: cardData.rarity || 'COMUN',
          expansion: cardData.expansion || '',
          race: races,
          isActive: cardData.is_active || false
        })
      } else {
        await Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Carta no encontrada',
          text: 'La carta que buscas no existe'
        })
        router.push('/admin/cards')
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      await Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar la carta'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que los aliados tengan al menos una raza
    if (formData.type === 'ALIADO' && formData.race.length === 0) {
      await Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Raza requerida',
        text: 'Los aliados deben tener al menos una raza asignada'
      })
      return
    }

    setSaving(true)

    try {
      // Convertir el array de razas a string separado por comas (solo para aliados)
      const dataToSend = {
        ...formData,
        race: formData.type === 'ALIADO' && formData.race.length > 0 
          ? formData.race.join(', ') 
          : null
      }

      const response = await fetch(`/api/admin/cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Éxito!',
          text: 'Carta actualizada exitosamente',
          timer: 2000,
          showConfirmButton: false
        })
        router.push('/admin/cards')
      } else {
        const error = await response.json()
        await Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudo actualizar la carta'
        })
      }
    } catch (error) {
      console.error('Error updating card:', error)
      await Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar la carta'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CardFormData, value: string | boolean) => {
    setFormData(prev => {
      const updates: Partial<CardFormData> = { [field]: value }
      
      // Auto-completar URL de imagen cuando se selecciona una expansión
      if (field === 'expansion' && typeof value === 'string' && value) {
        const basePath = EXPANSION_TO_PATH[value]
        if (basePath) {
          // Solo actualizar si la URL actual está vacía o es de otra expansión
          const currentUrl = prev.imageUrl || ''
          if (!currentUrl || !currentUrl.includes(basePath)) {
            updates.imageUrl = basePath
          }
        }
      }
      
      // Auto-copiar nombre del archivo cuando se escribe en la URL
      if (field === 'imageUrl' && typeof value === 'string') {
        const filename = value.split('/').pop()
        if (filename && filename.includes('.')) {
          updates.imageFile = filename
        }
      }
      
      // Limpiar coste cuando se selecciona ORO
      if (field === 'type' && value === 'ORO') {
        updates.cost = ''
      }
      
      return { ...prev, ...updates }
    })
  }

  const handleRaceToggle = (race: string) => {
    setFormData(prev => {
      const currentRaces = prev.race
      if (currentRaces.includes(race)) {
        // Remover la raza
        return { ...prev, race: currentRaces.filter(r => r !== race) }
      } else {
        // Agregar la raza si no hay más de 3
        if (currentRaces.length >= 3) {
          Swal.fire({
            ...swalConfig,
            icon: 'warning',
            title: 'Límite alcanzado',
            text: 'Solo puedes seleccionar hasta 3 razas',
            timer: 2000
          })
          return prev
        }
        return { ...prev, race: [...currentRaces, race] }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
          <p className="text-[#4ECDC4]">Cargando carta...</p>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4ECDC4]">Carta no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#F4C430]">Editar Carta</h1>
                <p className="text-[#4ECDC4] mt-2">
                  Completa la información de la carta para el formato Imperio
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 text-[#4ECDC4] hover:text-[#F4C430] border-2 border-[#2D9B96] rounded-lg hover:bg-[#1A2332] transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Inicio
                </Link>
                <button
                  onClick={() => router.push('/admin/cards')}
                  className="px-4 py-2 text-[#F4C430] hover:text-[#FFD700] border-2 border-[#F4C430] rounded-lg hover:bg-[#1A2332] transition-colors flex items-center gap-2 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al listado
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vista previa de la carta */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-full md:w-64 h-auto md:h-[22rem] bg-gradient-to-br from-[#0A0E1A] to-[#1A2332] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[#2D9B96] shadow-lg">
                    {(() => {
                      const imageUrl = formData.imageUrl ? getCardFullImageUrl(formData.imageUrl) : null
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-16 h-16 mx-auto text-[#4ECDC4] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-[#4ECDC4]">Sin imagen</span>
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-xs text-[#4ECDC4] text-center mt-2">Vista previa de la carta</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Nombre de la carta *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                      placeholder="Ej: Dragón Ancestral"
                      required
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                      required
                    >
                      {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Coste (no aplica para ORO) */}
                  {formData.type !== 'ORO' && (
                    <div>
                      <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                        Coste
                      </label>
                      <input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => handleChange('cost', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Rareza */}
                  <div>
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Rareza *
                    </label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => handleChange('rarity', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                      required
                    >
                      {Object.entries(RARITY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuerza (solo para Aliados) */}
                  {formData.type === 'ALIADO' && (
                    <div>
                      <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                        Fuerza *
                      </label>
                      <input
                        type="number"
                        value={formData.attack}
                        onChange={(e) => handleChange('attack', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  )}

                  {/* Razas (solo para Aliados) */}
                  {formData.type === 'ALIADO' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                        Razas * (Selecciona hasta 3)
                      </label>
                      {formData.race.length === 0 && (
                        <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
                          <p className="text-sm text-yellow-400">
                            ⚠️ Esta carta no tiene razas asignadas. Por favor selecciona al menos una raza.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {RACES.map((race) => {
                          const isSelected = formData.race.includes(race)
                          return (
                            <button
                              key={race}
                              type="button"
                              onClick={() => handleRaceToggle(race)}
                              className={`px-4 py-2.5 rounded-lg border-2 transition-all font-medium ${
                                isSelected
                                  ? 'bg-[#F4C430] border-[#F4C430] text-[#0A0E1A]'
                                  : 'bg-[#0A0E1A] border-[#2D9B96] text-[#E8E8E8] hover:border-[#F4C430]'
                              }`}
                            >
                              {race}
                            </button>
                          )
                        })}
                      </div>
                      {formData.race.length > 0 && (
                        <p className="mt-2 text-sm text-[#4ECDC4]">
                          Seleccionadas: {formData.race.join(', ')} ({formData.race.length}/3)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Expansión */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Expansión/Edición *
                    </label>
                    <select
                      value={formData.expansion}
                      onChange={(e) => handleChange('expansion', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                      required
                      disabled={expansionsLoading}
                    >
                      <option value="">
                        {expansionsLoading ? 'Cargando expansiones...' : 'Selecciona una expansión'}
                      </option>
                      {expansions.map((expansion) => (
                        <option key={expansion} value={expansion}>{expansion}</option>
                      ))}
                    </select>
                  </div>

                  {/* Habilidad */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Habilidad/Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all resize-none"
                      placeholder="Describe la habilidad o efecto de la carta..."
                    />
                  </div>

                  {/* URL de imagen */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      URL de la imagen
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => handleChange('imageUrl', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                      placeholder="Ej: /cards/napoleon/230.png"
                    />
                    <p className="mt-1 text-xs text-[#4ECDC4]">
                      Ruta completa de la imagen (ej: /cards/expansion/numero.png)
                    </p>
                  </div>

                  {/* Archivo de imagen */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Nombre del archivo
                    </label>
                    <input
                      type="text"
                      value={formData.imageFile}
                      onChange={(e) => handleChange('imageFile', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                      placeholder="Ej: 230.png"
                    />
                    <p className="mt-1 text-xs text-[#4ECDC4]">
                      Solo el nombre del archivo con extensión (ej: 230.png)
                    </p>
                  </div>

                  {/* Estado completado */}
                  <div className="md:col-span-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleChange('isActive', e.target.checked)}
                        className="mr-3 w-4 h-4 text-[#F4C430] rounded focus:ring-2 focus:ring-[#F4C430]"
                      />
                      <span className="text-sm font-semibold text-[#E8E8E8]">
                        Carta completada (lista para usar)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Información técnica (solo lectura) */}
              <div className="border-t border-[#2D9B96] pt-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-4">Información Técnica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">
                      Archivo de imagen
                    </label>
                    <input
                      type="text"
                      value={formData.imageFile}
                      readOnly
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg text-[#707070] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">
                      URL de imagen
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      readOnly
                      className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg text-[#707070] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4 pt-6 border-t border-[#2D9B96]">
                <button
                  type="button"
                  onClick={() => router.push('/admin/cards')}
                  className="px-6 py-3 text-[#E8E8E8] bg-[#0A0E1A] border border-[#2D9B96] rounded-lg hover:bg-[#1A2332] transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#F4C430] text-[#0A0E1A] rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50 signo-glow font-medium"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
