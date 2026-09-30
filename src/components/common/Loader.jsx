import {
    ParkingSquare,
    LoaderCircle,
} from 'lucide-react'

const LoaderPage = () => {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <section className="flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-slate-200 opacity-60" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-300">
                        <ParkingSquare
                            size={32}
                            strokeWidth={1.8}
                            className="text-white"
                        />
                    </div>
                </div>

                <h1 className="mt-6 text-xl font-bold text-slate-900">
                    Cargando MedaPark
                </h1>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Estamos preparando la información de los
                    parqueaderos. Un momento, por favor.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-600">
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