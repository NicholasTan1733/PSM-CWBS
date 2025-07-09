export const cities = [
  {
    id: 'selangor',
    name: 'Selangor',
    image: require('../../assets/items/selangor.png'),
    description: 'The Golden State of Malaysia with modern car wash facilities',
  },
  {
    id: 'johor',
    name: 'Johor',
    image: require('../../assets/items/johor.png'),
    description: 'Southern gateway with premium car care services',
  },
  {
    id: 'perlis',
    name: 'Perlis',
    image: require('../../assets/items/perlis.png'),
    description: 'The smallest state offering high-quality car wash experiences',
  },
];

export const shops = [
  {
    id: 'selangor_premium',
    name: 'Selangor Premium Car Wash',
    cityId: 'selangor',
    address: '15, Jalan SS 15/4, SS 15, 47500 Subang Jaya, Selangor',
    image: require('../../assets/items/shop1.png'),
    rating: 4.8,
    openingHour: '08:00',
    closingHour: '18:00',
    description: 'Premium car wash service with state-of-the-art equipment and experienced staff',
    adminEmail: 'admin.selangor@swiftcarwash.com',
    coordinates: { latitude: 3.0448, longitude: 101.5315 },
    phone: '+60 3-5635 4321',
    facilities: ['Air Conditioning', 'Waiting Area', 'WiFi', 'Refreshments'],
  },
  {
    id: 'johor_deluxe',
    name: 'Johor Deluxe Car Wash & Detailing',
    cityId: 'johor',
    address: '25, Jalan Permas 10/5, Bandar Baru Permas Jaya, 81750 Johor Bahru, Johor',
    image: require('../../assets/items/shop2.png'),
    rating: 4.6,
    openingHour: '08:00',
    closingHour: '18:00',
    description: 'Specialized in car polish and detailing services with attention to detail',
    adminEmail: 'admin.johor@swiftcarwash.com',
    coordinates: { latitude: 1.4849, longitude: 103.7618 },
    phone: '+60 7-382 1234',
    facilities: ['Premium Detailing Bay', 'Customer Lounge', 'Valet Service'],
  },
  {
    id: 'perlis_express',
    name: 'Perlis Express Car Spa',
    cityId: 'perlis',
    address: '10, Jalan Bukit Lagi, Taman Padi Emas, 01000 Kangar, Perlis',
    image: require('../../assets/items/shop3.png'),
    rating: 4.7,
    openingHour: '08:00',
    closingHour: '18:00',
    description: 'Professional coating services that protect your car for months',
    adminEmail: 'admin.perlis@swiftcarwash.com',
    coordinates: { latitude: 6.4414, longitude: 100.1986 },
    phone: '+60 4-976 5432',
    facilities: ['Express Service', 'Coating Specialist', 'Quick Turnaround'],
  },
];

export const stateCoordinates = {
  'selangor': { latitude: 3.0738, longitude: 101.5183 },
  'johor': { latitude: 1.4927, longitude: 103.7414 },
  'perlis': { latitude: 6.4414, longitude: 100.1986 },
  'kuala_lumpur': { latitude: 3.1390, longitude: 101.6869 },
  'penang': { latitude: 5.4164, longitude: 100.3327 },
  'sabah': { latitude: 5.9804, longitude: 116.0735 },
  'sarawak': { latitude: 1.5533, longitude: 110.3592 },
  'pahang': { latitude: 3.8126, longitude: 103.3256 },
  'perak': { latitude: 4.5921, longitude: 101.0901 },
  'kedah': { latitude: 6.1184, longitude: 100.3685 },
  'kelantan': { latitude: 6.1254, longitude: 102.2386 },
  'terengganu': { latitude: 5.3117, longitude: 103.1324 },
  'melaka': { latitude: 2.1896, longitude: 102.2501 },
  'negeri_sembilan': { latitude: 2.7297, longitude: 101.9381 },
  'putrajaya': { latitude: 2.9264, longitude: 101.6964 },
  'labuan': { latitude: 5.2767, longitude: 115.2417 },
};

export const shopCoordinates = {
  'selangor_premium': { latitude: 3.0448, longitude: 101.5315 },
  'johor_deluxe': { latitude: 1.4849, longitude: 103.7618 },
  'perlis_express': { latitude: 6.4414, longitude: 100.1986 },
};

export const services = {
  selangor_premium: [
    {
      id: 'normal_wash',
      name: 'Normal Wash',
      duration: 30,
      price: 25.00,
      description: 'Exterior wash, tire cleaning, and basic interior vacuum.',
      icon: 'car-wash'
    },
    {
      id: 'water_wax_wash',
      name: 'Water Wax Wash',
      duration: 30,
      price: 35.00,
      description: 'Normal wash plus water-based wax for added shine and protection.',
      icon: 'shimmer'
    },
    {
      id: 'nano_ceramic_wash',
      name: 'Nano Ceramic Wash',
      duration: 45,
      price: 45.00,
      description: 'Advanced wash with nano ceramic coating for superior protection.',
      icon: 'car-wash'
    }
  ],
  
  johor_deluxe: [
    {
      id: 'standard_wash',
      name: 'Standard Wash',
      duration: 30,
      price: 25.00,
      description: 'Basic exterior wash with wheel cleaning.',
      icon: 'car-wash'
    },
    {
      id: 'premium_polish',
      name: 'Premium Polish & Detail',
      duration: 60,
      price: 90.00,
      description: 'Comprehensive polish with paint correction and detailed interior cleaning.',
      icon: 'shimmer'
    },
    {
      id: 'executive_detail',
      name: 'Executive Detail Package',
      duration: 90,
      price: 150.00,
      description: 'Complete detail service with premium wax and leather conditioning.',
      icon: 'car-wash'
    }
  ],
  
  perlis_express: [
    {
      id: 'express_wash',
      name: 'Express Wash',
      duration: 20,
      price: 20.00,
      description: 'Quick exterior wash for people on the go.',
      icon: 'car-wash'
    },
    {
      id: 'premium_coating',
      name: 'Premium Coating',
      duration: 120,
      price: 200.00,
      description: 'Professional-grade ceramic coating with 6-month protection.',
      icon: 'shimmer'
    },
    {
      id: 'diamond_coating',
      name: 'Diamond Coating Package',
      duration: 180,
      price: 350.00,
      description: 'Top-tier coating with 12-month protection and full interior detail.',
      icon: 'car-wash'
    }
  ]
};

export const addOns = [
  {
    id: 'tire_shine',
    name: 'Tire Shine',
    price: 5.00,
    icon: 'radius'
  },
  {
    id: 'interior_sanitization',
    name: 'Interior Sanitization',
    price: 10.00,
    icon: 'spray'
  },
  {
    id: 'engine_bay_cleaning',
    name: 'Engine Bay Cleaning',
    price: 15.00,
    icon: 'engine'
  },
  {
    id: 'headlight_restoration',
    name: 'Headlight Restoration',
    price: 25.00,
    icon: 'car-light-high'
  }
];

//degrees to radians
//Haversine formula
/*360 degrees = 2π radians
180 degrees = π radians
1 degree = π/180 radians*/
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

export const findNearestShop = (userCoords, shopList = shops) => {
  let nearestShop = null;
  let shortestDistance = Infinity;

  shopList.forEach(shop => {
    if (shop.coordinates) {
      const distance = calculateDistance(
        userCoords.latitude, 
        userCoords.longitude,
        shop.coordinates.latitude, 
        shop.coordinates.longitude
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestShop = { ...shop, distance: Math.round(distance * 10) / 10 };
      }
    }
  });

  return nearestShop;
};

export const findNearestCity = (userCoords, cityList = cities) => {
  let nearestCity = null;
  let shortestDistance = Infinity;

  cityList.forEach(city => {
    const cityCoords = stateCoordinates[city.id];
    if (cityCoords) {
      const distance = calculateDistance(
        userCoords.latitude, 
        userCoords.longitude,
        cityCoords.latitude, 
        cityCoords.longitude
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = { ...city, distance: Math.round(distance) };
      }
    }
  });

  return nearestCity;
};