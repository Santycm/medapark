import type { Factor, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { toAuthErrorCode, toUserMessage, type AuthErrorCode } from '../lib/errors'
import { fail, ok, type Result } from '../lib/result'

export const login = async (email: string, password: string): Promise<{ user: User; session: Session; requiresMfa: boolean }> => {
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

export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw error
    }
}

export const getCurrentUser = async (): Promise<User | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) {
        throw error
    }

    return user
}

export const getSession = async (): Promise<Session | null> => {
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

export const getVerifiedTotpFactor = async (): Promise<Factor | null> => {
    const factors = await getMfaFactors()

    return factors.totp.find(
        (factor) => factor.status === 'verified'
    ) ?? null
}

export const createMfaChallenge = async (factorId: string) => {
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
    factorId: string,
    challengeId: string,
    code: string
): Promise<void> => {
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

export const unenrollMfa = async (factorId: string): Promise<void> => {
    const { error } =
        await supabase.auth.mfa.unenroll({
            factorId,
        })

    if (error) {
        throw error
    }
}

export const resetPassword = async (email: string): Promise<void> => {
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

export const updatePassword = async (password: string): Promise<void> => {
    const { error } =
        await supabase.auth.updateUser({
            password,
        })

    if (error) {
        throw error
    }
}


/* ------------------------------------------------------------------ *
 * Funciones del MVP (feature 001): no lanzan, devuelven `Result` con el
 * mensaje ya traducido. Envuelven las funciones existentes de arriba.
 * ------------------------------------------------------------------ */

export type AuthSnapshot = {
    hasSession: boolean
    user: { id: string; email: string } | null
    currentLevel: 'aal1' | 'aal2' | null
    verifiedTotpFactorId: string | null
}

const toAal = (level: string | null): 'aal1' | 'aal2' | null =>
    level === 'aal1' ? 'aal1' : level === 'aal2' ? 'aal2' : null

const failure = (error: unknown): { ok: false; code: AuthErrorCode; message: string } => {
    const code = toAuthErrorCode(error)
    return fail(code, toUserMessage(code))
}

/** HU1: trim + toLowerCase del correo y luego login(). */
export const signInAdmin = async (
    email: string,
    password: string
): Promise<Result<{ userId: string }, AuthErrorCode>> => {
    try {
        const { user } = await login(email.trim().toLowerCase(), password)
        return ok({ userId: user.id })
    } catch (error) {
        return failure(error)
    }
}

/** Estado actual de la sesión. Nunca lanza (sin sesión → hasSession false). */
export const getAuthSnapshot = async (): Promise<AuthSnapshot> => {
    const empty: AuthSnapshot = {
        hasSession: false,
        user: null,
        currentLevel: null,
        verifiedTotpFactorId: null,
    }

    try {
        const user = await getCurrentUser()

        if (!user) {
            return empty
        }

        const [aal, factor] = await Promise.all([
            getAuthenticatorAssuranceLevel(),
            getVerifiedTotpFactor(),
        ])

        return {
            hasSession: true,
            user: { id: user.id, email: user.email ?? '' },
            currentLevel: toAal(aal.currentLevel),
            verifiedTotpFactorId: factor?.id ?? null,
        }
    } catch {
        return empty
    }
}

/** HU2 (enrolamiento): elimina los factores TOTP 'unverified' y luego enrolla uno nuevo. */
export const startTotpEnrollment = async (): Promise<
    Result<{ factorId: string; qrCodeSvg: string; secret: string }, AuthErrorCode>
> => {
    try {
        const factors = await getMfaFactors()

        for (const factor of factors.all) {
            if (factor.factor_type === 'totp' && factor.status === 'unverified') {
                await unenrollMfa(factor.id)
            }
        }

        const data = await enrollMfa()

        return ok({
            factorId: data.id,
            qrCodeSvg: data.totp.qr_code,
            secret: data.totp.secret,
        })
    } catch (error) {
        return failure(error)
    }
}

/** HU2: createMfaChallenge envuelto. */
export const createChallenge = async (
    factorId: string
): Promise<Result<{ challengeId: string }, AuthErrorCode>> => {
    try {
        const challenge = await createMfaChallenge(factorId)
        return ok({ challengeId: challenge.id })
    } catch (error) {
        return failure(error)
    }
}

/** HU2: verifyMfa envuelto (distingue codigo_incorrecto y codigo_expirado). */
export const verifyCode = async (
    factorId: string,
    challengeId: string,
    code: string
): Promise<Result<void, AuthErrorCode>> => {
    try {
        await verifyMfa(factorId, challengeId, code)
        return ok(undefined)
    } catch (error) {
        return failure(error)
    }
}

/** HU8 y cancelación: cierra solo la sesión de este navegador. Nunca falla hacia la UI. */
export const signOutLocal = async (): Promise<void> => {
    try {
        await supabase.auth.signOut({ scope: 'local' })
    } catch {
        // la sesión local se considera cerrada aunque falle la red
    }
}
