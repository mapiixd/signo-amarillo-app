import Link from 'next/link'
import { SupabaseCard, CardWithQuantity, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'

interface CardProps {
  card: SupabaseCard | CardWithQuantity
  showQuantity?: boolean
  clickable?: boolean
}

export function Card({ card, showQuantity = false, clickable = true }: CardProps) {
  const quantity = 'quantity' in card ? card.quantity : undefined

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ALIADO': return 'bg-blue-100 text-blue-800'
      case 'TALISMAN': return 'bg-purple-100 text-purple-800'
      case 'ARMA': return 'bg-red-100 text-red-800'
      case 'TOTEM': return 'bg-green-100 text-green-800'
      case 'ORO': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'VASALLO': return 'bg-blue-100 text-blue-800'
      case 'CORTESANO': return 'bg-red-100 text-red-800'
      case 'REAL': return 'bg-yellow-100 text-yellow-800'
      case 'MEGA_REAL': return 'bg-white text-gray-800 border border-gray-300'
      case 'ULTRA_REAL': return 'bg-black text-white'
      case 'LEGENDARIA': return 'bg-orange-100 text-orange-800'
      case 'PROMO': return 'bg-green-100 text-green-800'
      case 'SECRETA': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const cardContent = (
    <div className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 transition-all ${clickable ? 'hover:shadow-xl hover:scale-105 cursor-pointer' : 'hover:shadow-lg'}`}>
      <div className="aspect-[3/4] bg-gray-100 rounded mb-3 flex items-center justify-center">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="text-gray-400 text-sm text-center">
            Sin imagen
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-lg text-gray-900">{card.name}</h3>

        <div className="flex justify-between items-center text-sm">
          <span className={`px-2 py-1 rounded capitalize ${getTypeColor(card.type)}`}>
            {CARD_TYPE_LABELS[card.type]}
          </span>
          <span className={`px-2 py-1 rounded capitalize ${getRarityColor(card.rarity)}`}>
            {RARITY_TYPE_LABELS[card.rarity]}
          </span>
        </div>

        <div className="flex justify-between items-center">
          {card.cost !== null && card.type !== 'ORO' && (
            <span className="text-gray-600">
              Costo: <span className="font-semibold">{card.cost}</span>
            </span>
          )}
          {card.type === 'ORO' && (
            <span className="text-yellow-600 font-semibold">ORO</span>
          )}
          {showQuantity && quantity && (
            <span className="text-gray-600">
              Cantidad: <span className="font-semibold">{quantity}</span>
            </span>
          )}
        </div>

        {(card.attack !== null || card.defense !== null) && card.type === 'ALIADO' && (
          <div className="flex justify-between text-sm">
            {card.attack !== null && (
              <span className="text-red-600 font-semibold">
                ⚔️ {card.attack}
              </span>
            )}
            {card.defense !== null && (
              <span className="text-blue-600 font-semibold">
                🛡️ {card.defense}
              </span>
            )}
          </div>
        )}

        {card.description && (
          <p className="text-gray-700 text-sm mt-2">{card.description}</p>
        )}

        <div className="text-xs text-gray-500 mt-2">
          {card.expansion}
        </div>

        {!card.is_active && (
          <div className="text-xs text-orange-600 font-medium mt-1">
            ⚠️ Pendiente de completar
          </div>
        )}
      </div>
    </div>
  )

  if (clickable) {
    return (
      <Link href={`/cards/${encodeURIComponent(card.name)}`}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
