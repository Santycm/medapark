import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { sortByName, toPublicParking, type PublicParking } from '../domain/publicParking'
import { MSG } from '../lib/messages'
import { fail, ok, type Result } from '../lib/result'

type ViewRow = Tables<'public_parking_lots'>

/** Fila de la vista pública con los campos que el mapa necesita garantizados. */
export type PublicParkingRow = Omit<ViewRow, 'id' | 'latitude' | 'longitude'> & {
    id: string
    latitude: number
    longitude: number
}

const isLocatable = (row: ViewRow): row is PublicParkingRow =>
    row.id !== null && row.latitude !== null && row.longitude !== null

export const getPublicParkings = async (): Promise<PublicParkingRow[]> => {
    const { data, error } = await supabase
        .from('public_parking_lots')
        .select('*')
        .order('name')

    if (error) {
        throw error
    }

    return (data ?? []).filter(isLocatable)
}

export const getPublicParkingById = async (id: string): Promise<PublicParkingRow | null> => {
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

/** HU9: parqueaderos públicos ya mapeados al dominio y ordenados por nombre. No lanza. */
export const listPublicParkings = async (): Promise<Result<PublicParking[], 'RED'>> => {
    const { data, error } = await supabase.from('public_parking_lots').select('*').order('name')

    if (error) {
        return fail('RED', MSG.publico.errorCarga)
    }

    const parkings = (data ?? [])
        .map(toPublicParking)
        .filter((p): p is PublicParking => p !== null)

    return ok(sortByName(parkings))
}
