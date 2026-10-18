import {
    ParkingSquare,
    LoaderCircle,
} from 'lucide-react'

const LoaderPage = ({ fullScreen = true }: { fullScreen?: boolean }) => {
    return (
        <main
            className={`flex items-center justify-center bg-canvas px-4 ${
                fullScreen ? 'min-h-screen' : 'min-h-64'
            }`}
            role="status"
            aria-live="polite"
        >
            <section className="flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-brand-50 opacity-60" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-slate-300">
                        <ParkingSquare
                            size={32}
                            strokeWidth={1.8}
                            className="text-white"
                        />
                    </div>
                </div>

                <h1 className="mt-6 text-xl font-bold text-navy-900">
                    Cargando MedaPark
                </h1>

                <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
                    Un momento, por favor.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-ink-500">
                    <LoaderCircle
                        size={18}
                        className="animate-spin"
                    />
                    <span>Cargando...</span>
                </div>
            </section>
        </main>
    )
}

export default LoaderPage
