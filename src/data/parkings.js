export const parkings = [
    {
        id: 'parking-001',
        name: 'Parqueadero Centro',
        address: 'Centro de Medellín',
        neighborhood: 'La Candelaria',
        latitude: 6.25184,
        longitude: -75.56359,
        phone: '+57 604 000 0000',
        schedule: {
            mondayToFriday: '6:00 AM - 10:00 PM',
            saturday: '7:00 AM - 10:00 PM',
            sunday: '8:00 AM - 8:00 PM',
        },
        rates: {
            car: '$5.000 / hora',
            motorcycle: '$3.000 / hora',
        },
        availability: {
            cars: {
                total: 80,
                available: 24,
            },
            motorcycles: {
                total: 40,
                available: 18,
            },
        },
        description:
            'Parqueadero ubicado en el centro de Medellín, con acceso cercano a zonas comerciales y administrativas.',
    },

    {
        id: 'parking-002',
        name: 'Parqueadero El Poblado',
        address: 'El Poblado, Medellín',
        neighborhood: 'El Poblado',
        latitude: 6.20876,
        longitude: -75.56732,
        phone: '+57 604 000 0001',
        schedule: {
            mondayToFriday: '5:00 AM - 11:00 PM',
            saturday: '6:00 AM - 11:00 PM',
            sunday: '7:00 AM - 10:00 PM',
        },
        rates: {
            car: '$6.000 / hora',
            motorcycle: '$3.500 / hora',
        },
        availability: {
            cars: {
                total: 120,
                available: 67,
            },
            motorcycles: {
                total: 50,
                available: 31,
            },
        },
        description:
            'Parqueadero cercano a restaurantes, centros comerciales y zonas empresariales de El Poblado.',
    },

    {
        id: 'parking-003',
        name: 'Parqueadero Laureles',
        address: 'Laureles, Medellín',
        neighborhood: 'Laureles',
        latitude: 6.24425,
        longitude: -75.59342,
        phone: '+57 604 000 0002',
        schedule: {
            mondayToFriday: '6:00 AM - 10:00 PM',
            saturday: '7:00 AM - 10:00 PM',
            sunday: '8:00 AM - 8:00 PM',
        },
        rates: {
            car: '$5.500 / hora',
            motorcycle: '$3.000 / hora',
        },
        availability: {
            cars: {
                total: 90,
                available: 12,
            },
            motorcycles: {
                total: 35,
                available: 4,
            },
        },
        description:
            'Parqueadero ubicado en el sector de Laureles, con acceso a establecimientos comerciales y gastronómicos.',
    },

    {
        id: 'parking-004',
        name: 'Parqueadero Ciudad del Río',
        address: 'Ciudad del Río, Medellín',
        neighborhood: 'El Poblado',
        latitude: 6.22854,
        longitude: -75.57191,
        phone: '+57 604 000 0003',
        schedule: {
            mondayToFriday: '5:30 AM - 11:00 PM',
            saturday: '6:00 AM - 11:00 PM',
            sunday: '7:00 AM - 10:00 PM',
        },
        rates: {
            car: '$6.000 / hora',
            motorcycle: '$3.500 / hora',
        },
        availability: {
            cars: {
                total: 150,
                available: 83,
            },
            motorcycles: {
                total: 60,
                available: 42,
            },
        },
        description:
            'Parqueadero cercano al Museo de Arte Moderno de Medellín y al sector de Ciudad del Río.',
    },

    {
        id: 'parking-005',
        name: 'Parqueadero Estadio',
        address: 'Sector Estadio, Medellín',
        neighborhood: 'Laureles - Estadio',
        latitude: 6.25673,
        longitude: -75.59084,
        phone: '+57 604 000 0004',
        schedule: {
            mondayToFriday: '5:00 AM - 11:00 PM',
            saturday: '5:00 AM - 11:00 PM',
            sunday: '6:00 AM - 10:00 PM',
        },
        rates: {
            car: '$4.500 / hora',
            motorcycle: '$2.500 / hora',
        },
        availability: {
            cars: {
                total: 100,
                available: 8,
            },
            motorcycles: {
                total: 50,
                available: 3,
            },
        },
        description:
            'Parqueadero cercano a la Unidad Deportiva Atanasio Girardot y al sector Estadio.',
    },
]