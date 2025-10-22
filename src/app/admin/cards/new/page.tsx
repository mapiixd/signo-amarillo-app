'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CardType, RarityType } from '@prisma/client'
import { CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import Swal from 'sweetalert2'
import Footer from '@/components/Footer'

interface CardFormData {
  name: string
  type: CardType
  cost: string
  attack: string
  description: string
  imageUrl: string
  imageFile: string
  rarity: RarityType
  expansion: string
  isActive: boolean
}

export default function NewCardPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    type: CardType.ALIADO,
    cost: '',
    attack: '',
    description: '',
    imageUrl: '',
    imageFile: '',
    rarity: RarityType.COMUN,
    expansion: '',
    isActive: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newCard = await response.json()
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Carta creada exitosamente',
          confirmButtonColor: '#2563eb',
          timer: 2000,
          showConfirmButton: false
        })
        router.push(`/admin/cards/${newCard.id}/edit`)
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudo crear la carta',
          confirmButtonColor: '#2563eb'
        })
      }
    } catch (error) {
      console.error('Error creating card:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la carta',
        confirmButtonColor: '#2563eb'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CardFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#F4C430]">Nueva Carta</h1>
                <p className="text-[#4ECDC4] mt-2">
                  Crea una nueva carta para el formato Imperio
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={(e) => handleChange('type', e.target.value as CardType)}
                    className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                    required
                  >
                    {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Coste */}
                <div>
                  <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                    Coste {formData.type === CardType.ORO && <span className="text-[#4ECDC4] font-normal">(dejar vacío para oros)</span>}
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

                {/* Rareza */}
                <div>
                  <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                    Rareza *
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => handleChange('rarity', e.target.value as RarityType)}
                    className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                    required
                  >
                    {Object.entries(RARITY_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Fuerza (solo para Aliados) */}
                {formData.type === CardType.ALIADO && (
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

                {/* Expansión */}
                <div className={formData.type === CardType.ALIADO ? '' : 'md:col-span-2'}>
                  <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                    Expansión/Edición *
                  </label>
                  <input
                    type="text"
                    value={formData.expansion}
                    onChange={(e) => handleChange('expansion', e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                    placeholder="Ej: Cenizas de Fuego"
                    required
                  />
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
                  {saving ? 'Creando...' : 'Crear Carta'}
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
