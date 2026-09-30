import { supabase } from '../lib/supabase'

export const login = async (email, password) => {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password,
        })

    if (error) {
        throw error
    }

    const {
        data: aal,
        error: aalError,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalError) {
        throw aalError
    }

    return {
        user: data.user,
        session: data.session,
        requiresMfa:
            aal.currentLevel === 'aal1' &&
            aal.nextLevel === 'aal2',
    }
}

export const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw error
    }
}

export const getCurrentUser = async () => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) {
        throw error
    }

    return user
}

export const getSession = async () => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession()

    if (error) {
        throw error
    }

    return session
}

export const getAuthenticatorAssuranceLevel = async () => {
    const {
        data,
        error,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (error) {
        throw error
    }

    return data
}

export const getMfaFactors = async () => {
    const {
        data,
        error,
    } = await supabase.auth.mfa.listFactors()

    if (error) {
        throw error
    }

    return data
}

export const getVerifiedTotpFactor = async () => {
    const factors = await getMfaFactors()

    return factors.totp.find(
        (factor) => factor.status === 'verified'
    ) ?? null
}

export const createMfaChallenge = async (factorId) => {
    const {
        data,
        error,
    } = await supabase.auth.mfa.challenge({
        factorId,
    })

    if (error) {
        throw error
    }

    return data
}

export const verifyMfa = async (
    factorId,
    challengeId,
    code
) => {
    const { error } =
        await supabase.auth.mfa.verify({
            factorId,
            challengeId,
            code,
        })

    if (error) {
        throw error
    }
}

export const enrollMfa = async () => {
    const {
        data,
        error,
    } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MedaPark',
    })

    if (error) {
        throw error
    }

    return data
}

export const unenrollMfa = async (factorId) => {
    const { error } =
        await supabase.auth.mfa.unenroll({
            factorId,
        })

    if (error) {
        throw error
    }
}

export const resetPassword = async (email) => {
    const { error } =
        await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    `${window.location.origin}/update-password`,
            }
        )

    if (error) {
        throw error
    }
}

export const updatePassword = async (password) => {
    const { error } =
        await supabase.auth.updateUser({
            password,
        })

    if (error) {
        throw error
    }
}