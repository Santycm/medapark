import { Link } from 'react-router'

import ParkingMap from '../../components/map/ParkingMap'
import { parkings } from '../../data/parkings'

const Home = () => {
    return (
        <main className="min-h-screen bg-slate-100">
            <header className="relative z-1000 border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            MedaPark
                        </h1>

                        <p className="text-xs text-slate-500">
                            Parqueaderos de Medellín
                        </p>
                    </div>

                    <Link
                        to="/login"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Administración
                    </Link>
                </div>
            </header>

            <section className="relative h-[calc(100vh-73px)]">
                <ParkingMap parkings={parkings} />
            </section>
        </main>
    )
}

export default Home