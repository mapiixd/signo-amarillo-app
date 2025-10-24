// Sistema de baneos y restricciones por formato

export type BanStatus = 'banned' | 'limited-1' | 'limited-2' | 'allowed'

export interface BanlistEntry {
  cardName: string
  status: BanStatus
  maxCopies: number // 0 = prohibida, 1 = limitada a 1, 2 = limitada a 2, 3 = normal
}

export type FormatType = 'Imperio Racial' | 'VCR' | 'Triadas'

// Lista de baneos por formato
export const BANLISTS: Record<FormatType, BanlistEntry[]> = {
  'Imperio Racial': [
    // Prohibidas (0 copias)
    { cardName: 'Niten Ichi-Ryu', status: 'banned', maxCopies: 0 },
    { cardName: 'Rey Sigfried', status: 'banned', maxCopies: 0 },
    { cardName: 'Senso-ji', status: 'banned', maxCopies: 0 },
    { cardName: 'Hitodama', status: 'banned', maxCopies: 0 },
    { cardName: 'Ishikawa Goemon', status: 'banned', maxCopies: 0 },
    { cardName: 'Lugus', status: 'banned', maxCopies: 0 },
    { cardName: 'Galvarino', status: 'banned', maxCopies: 0 },
    { cardName: 'Ramsés II', status: 'banned', maxCopies: 0 },
    { cardName: 'Tenshi X-2', status: 'banned', maxCopies: 0 },
    { cardName: 'Fusil Patriota', status: 'banned', maxCopies: 0 },
    
    // Limitadas a 1 copia
    { cardName: 'Ptahhotep', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Herácles de Olimpia', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Loki', status: 'limited-1', maxCopies: 1 },
    { cardName: 'El Rey y el Verdugo', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Mjolnir', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Chaman del coyote', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Antiguo', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Glasir', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Gengis Kan', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Heimdal', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Apofis', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Shakar Raj', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Paladín', status: 'limited-1', maxCopies: 1 }, // BES-017-161
    { cardName: 'El Mago', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Cancha Rayada', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Bestia de Gévaudan', status: 'limited-1', maxCopies: 1 },
    
    // Limitadas a 2 copias
    { cardName: 'Ereshkigal', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Flechero', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Sheut', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Puntual conejo', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Shoki', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Alicia en Wonderland', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Rey de Amarillo', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Anillo de Vacío', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Chupacabra', status: 'limited-2', maxCopies: 2 },
    { cardName: 'Idunn', status: 'limited-2', maxCopies: 2 },
  ],
  
  'VCR': [
    // Prohibidas (0 copias)
    { cardName: 'Momificar', status: 'banned', maxCopies: 0 },
    { cardName: 'Septimus', status: 'banned', maxCopies: 0 },
    { cardName: 'Maho no Meiso', status: 'banned', maxCopies: 0 },
    { cardName: 'Kogarasumaru', status: 'banned', maxCopies: 0 },
    { cardName: 'Pathothep', status: 'banned', maxCopies: 0 },
    
    // Limitadas a 1 copia
    { cardName: 'Vodyanoy', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Moo', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Paris', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Onsen', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Oda Nobunaga', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Azi Sruvara', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Piramide Roja', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Pirata Wakou', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Jaculus', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Morrigan la cazadora', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Escorpion de Seth', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Svipdgar', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Monitor Araucano', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Eric Bloodaxe', status: 'limited-1', maxCopies: 1 },
    { cardName: 'Ayyappan', status: 'limited-1', maxCopies: 1 },
  ],
  
  'Triadas': [
    // Prohibidas (0 copias)
    { cardName: 'La Torre', status: 'banned', maxCopies: 0 },
    { cardName: 'Rey de Amarillo', status: 'banned', maxCopies: 0 },
    { cardName: 'Shub-Niggurath', status: 'banned', maxCopies: 0 },
    { cardName: 'Maho No Meiso', status: 'banned', maxCopies: 0 },
    { cardName: 'León Indiferente', status: 'banned', maxCopies: 0 },
    { cardName: 'Gengis Kan', status: 'banned', maxCopies: 0 },
    { cardName: 'Apofis', status: 'banned', maxCopies: 0 },
  ],
}

// Función para obtener el estado de una carta en un formato específico
export function getCardBanStatus(cardName: string, format: FormatType): BanlistEntry | null {
  const banlist = BANLISTS[format]
  if (!banlist) return null
  
  // Buscar coincidencia exacta o parcial (ignorando mayúsculas/minúsculas)
  return banlist.find(entry => 
    entry.cardName.toLowerCase() === cardName.toLowerCase() ||
    cardName.toLowerCase().includes(entry.cardName.toLowerCase())
  ) || null
}

// Función para verificar si una carta está prohibida
export function isCardBanned(cardName: string, format: FormatType): boolean {
  const status = getCardBanStatus(cardName, format)
  return status?.status === 'banned'
}

// Función para obtener el máximo de copias permitidas
export function getMaxCopies(cardName: string, format: FormatType): number {
  const status = getCardBanStatus(cardName, format)
  return status?.maxCopies ?? 3 // Por defecto, 3 copias
}

// Función para obtener el icono según el estado
export function getBanStatusIcon(status: BanStatus): string {
  switch (status) {
    case 'banned':
      return '⛔'
    case 'limited-1':
    case 'limited-2':
      return '☢️'
    default:
      return ''
  }
}

// Función para obtener la etiqueta de texto
export function getBanStatusLabel(status: BanStatus, maxCopies: number): string {
  switch (status) {
    case 'banned':
      return 'PROHIBIDA'
    case 'limited-1':
      return 'Limitada a 1 copia'
    case 'limited-2':
      return 'Limitada a 2 copias'
    default:
      return ''
  }
}

