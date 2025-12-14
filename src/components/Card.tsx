import Link from 'next/link'
import { SupabaseCard, CardWithQuantity, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'

interface CardProps {
  card: SupabaseCard | CardWithQuantity
  showQuantity?: boolean
  clickable?: boolean
}

export function Card({ card, showQuantity = false, clickable = true }: CardProps) {
  const quantity = 'quantity' in card ? card.quantity : undefined

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ALIADO': return 'bg-[#2D9B96] text-white border border-[#4ECDC4]'
      case 'TALISMAN': return 'bg-[#8B4789] text-white border border-[#A864A8]'
      case 'ARMA': return 'bg-[#B8384E] text-white border border-[#E74860]'
      case 'TOTEM': return 'bg-[#1A7F5A] text-white border border-[#2D9B76]'
      case 'ORO': return 'bg-[#F4C430] text-[#0A0E1A] border border-[#FFD700]'
      default: return 'bg-[#1A2332] text-[#A0A0A0] border border-[#2D3748]'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'VASALLO': return 'bg-[#3B82F6] text-white border border-[#60A5FA]' // Azul
      case 'CORTESANO': return 'bg-[#DC2626] text-white border border-[#F87171]' // Rojo
      case 'REAL': return 'bg-[#EAB308] text-[#0A0E1A] border border-[#FDE047]' // Amarillo
      case 'MEGA_REAL': return 'bg-[#E5E7EB] text-[#1F2937] border border-[#D1D5DB]' // Blanco/Gris
      case 'ULTRA_REAL': return 'bg-[#0A0A0A] text-white border border-[#3F3F46]' // Negro
      case 'LEGENDARIA': return 'bg-gradient-to-r from-[#FF6B35] to-[#2D9B96] text-white border border-[#FF8C42] signo-glow' // Naranja/Cyan con glow
      case 'PROMO': return 'bg-[#16A34A] text-white border border-[#22C55E]' // Verde
      case 'SECRETA': return 'bg-gradient-to-r from-[#8B4789] to-[#2D9B96] text-white border border-[#F4C430] signo-glow'
      default: return 'bg-[#1A2332] text-[#A0A0A0] border border-[#2D3748]'
    }
  }

  const imageUrl = card.image_url ? getCardImageUrl(card.image_url) : null

  const cardContent = (
    <div className={`bg-[#121825] rounded-lg shadow-lg p-4 border border-[#2D9B96] transition-all h-full flex flex-col ${clickable ? 'hover:shadow-2xl hover:scale-105 cursor-pointer hover-glow' : 'hover:shadow-xl'}`}>
      <div className="aspect-[3/4] bg-[#1A2332] rounded mb-3 flex items-center justify-center overflow-hidden border border-[#1A7F7A] flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        ) : (
          <div className="text-[#4ECDC4] text-sm text-center">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow space-y-2">
        <h3 className="font-bold text-lg text-[#F4C430] line-clamp-2 min-h-[3.5rem]">{card.name}</h3>

        <div className="flex justify-between items-center text-sm flex-shrink-0">
          <span className={`px-2 py-1 rounded capitalize ${getTypeColor(card.type)}`}>
            {CARD_TYPE_LABELS[card.type]}
          </span>
          <span className={`px-2 py-1 rounded capitalize ${getRarityColor(card.rarity)}`}>
            {RARITY_TYPE_LABELS[card.rarity]}
          </span>
        </div>

        <div className="flex justify-between items-center min-h-[1.5rem] flex-shrink-0 text-sm flex-wrap gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {card.type === 'ALIADO' && card.attack !== null && (
              <span className="text-[#E74860] font-semibold">
                ⚔️ {card.attack}
              </span>
            )}
            {card.cost !== null && card.type !== 'ORO' && (
              <span className="text-[#4ECDC4]">
                💰 <span className="font-semibold text-[#F4C430]">{card.cost}</span>
              </span>
            )}
            {card.type === 'ALIADO' && card.race && (
              <span className="text-[#4ECDC4]">
                Raza: <span className="font-semibold text-[#F4C430]">{card.race}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {card.type === 'ALIADO' && card.defense !== null && (
              <span className="text-[#4ECDC4] font-semibold">
                🛡️ {card.defense}
              </span>
            )}
            {showQuantity && quantity && (
              <span className="text-[#4ECDC4]">
                Cantidad: <span className="font-semibold text-[#F4C430]">{quantity}</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <div className="text-xs text-[#2D9B96]">
            {card.expansion}
          </div>

          {!card.is_active && (
            <div className="text-xs text-[#F4C430] font-medium mt-1">
              ⚠️ Pendiente de completar
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (clickable) {
    return (
      <Link href={`/cards/${encodeURIComponent(card.name)}`} className="h-full flex">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
