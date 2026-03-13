/**
 * Posición de la imagen de raza en las cards de barajas (object-position: "x y").
 * Ajusta cada valor según la imagen: 0% = arriba/izq, 50% = centro, 100% = abajo/derecha.
 * Se usa en /decks, /decks/community y /decks/[id].
 */
export const RACE_IMAGE_POSITION: Record<string, string> = {
  Bestia: '50% 20%',
  Caballero: '50% 20%',
  Dragón: '50% 15%',
  Eterno: '50% 20%',
  Faerie: '50% 10%',
  Guerrero: '50% 15%',
  Héroe: '50% 15%',
  Sacerdote: '50% 20%',
  Sombra: '50% 25%',
  Tenebris: '50% 25%',
  Paladín: '50% 40%',
  Desafiante: '50% 10%'
}
