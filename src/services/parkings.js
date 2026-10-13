import { supabase } from '../lib/supabase'

export const getPublicParkings = async () => {
    const { data, error } = await supabase
        .from('public_parking_lots')
        .select('*')
        .order('name')

    if (error) {
        throw error
    }

    return data
}

export const getPublicParkingById = async (id) => {
    const { data, error } = await supabase
        .from('public_parking_lots')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}
