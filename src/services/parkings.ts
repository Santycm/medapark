import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type PublicParkingRow = Tables<'public_parking_lots'>

/** Fila de la vista pública con los campos que el mapa necesita garantizados. */
export type PublicParking = Omit<PublicParkingRow, 'id' | 'latitude' | 'longitude'> & {
    id: string
    latitude: number
    longitude: number
}

const isLocatable = (row: PublicParkingRow): row is PublicParking =>
    row.id !== null && row.latitude !== null && row.longitude !== null

export const getPublicParkings = async (): Promise<PublicParking[]> => {
    const { data, error } = await supabase
        .from('public_parking_lots')
        .select('*')
        .order('name')

    if (error) {
        throw error
    }

    return (data ?? []).filter(isLocatable)
}

export const getPublicParkingById = async (id: string): Promise<PublicParking | null> => {
    const { data, error } = await supabase
        .from('public_parking_lots')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data && isLocatable(data) ? data : null
}
