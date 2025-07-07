

import { shops, services } from '../data/city-data';


const mockDB = {
  users: {},
  vehicles: {},
  bookings: {},
  feedback: {},
  payments: {}
};


const mockAdmins = {
  'admin.selangor@swiftcarwash.com': {
    uid: 'admin1',
    email: 'admin.selangor@swiftcarwash.com',
    password: 'Admin123!',
    userType: 'admin',
    name: 'Selangor Admin',
    shopId: 'selangor_premium'
  },
  'admin.johor@swiftcarwash.com': {
    uid: 'admin2',
    email: 'admin.johor@swiftcarwash.com',
    password: 'Admin123!',
    userType: 'admin',
    name: 'Johor Admin',
    shopId: 'johor_deluxe'
  },
  'admin.perlis@swiftcarwash.com': {
    uid: 'admin3',
    email: 'admin.perlis@swiftcarwash.com',
    password: 'Admin123!',
    userType: 'admin',
    name: 'Perlis Admin',
    shopId: 'perlis_express'
  }
};


let currentUser = null;


const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


const serverTimestamp = () => new Date().toISOString();


const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const generateOptimizedTimeSlots = (serviceDuration, openingHour, closingHour) => {
  const slots = [];
  const startMinutes = timeToMinutes(openingHour);
  const endMinutes = timeToMinutes(closingHour);
  
  const intervalMinutes = serviceDuration;
  
  for (let minutes = startMinutes; minutes <= endMinutes - serviceDuration; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }
  
  return slots;
};

const checkTimeSlotConflicts = (existingBookings, newTime, newDuration) => {
  const newStartMinutes = timeToMinutes(newTime);
  const newEndMinutes = newStartMinutes + newDuration;
  
  return existingBookings.some(booking => {
    const existingStartMinutes = timeToMinutes(booking.time);
    const existingEndMinutes = existingStartMinutes + (booking.service?.duration || 30);
    

    return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
  });
};

// Auth Functions

export const signUp = async (email, password) => {
  if (Object.values(mockDB.users).find(u => u.email === email)) {
    throw new Error('auth/email-already-in-use');
  }

  const uid = generateId();
  const user = { uid, email };
  
  mockDB.users[uid] = {
    email,
    password,
    userType: 'customer',
    createdAt: serverTimestamp()
  };
  
  currentUser = user;
  
  return { user };
};

export const createUserProfile = async (userId, userData) => {
  mockDB.users[userId] = {
    ...mockDB.users[userId],
    ...userData,
    updatedAt: serverTimestamp()
  };
  
  return true;
};

export const logIn = async (email, password) => {

  const user = Object.entries(mockDB.users).find(([_, u]) => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('auth/user-not-found');
  }
  
  const [uid, userData] = user;
  

  if (userData.userType === 'admin') {
    throw new Error('This is an admin account. Please use admin login.');
  }
  
  currentUser = { uid, email };
  
  return { user: currentUser };
};

export const loginAsAdmin = async (email, password) => {

  const admin = mockAdmins[email];
  
  if (!admin || admin.password !== password) {
    throw new Error('auth/user-not-found');
  }
  
  currentUser = { uid: admin.uid, email };
  
  return admin;
};

export const signOut = async () => {
  currentUser = null;
  return true;
};

export const resetPassword = async (email) => {

  console.log(`Password reset email sent to: ${email}`);
  return true;
};

// Database Functions

export const getUserProfile = async () => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const userData = mockDB.users[currentUser.uid];
  
  if (!userData) {
    mockDB.users[currentUser.uid] = {
      name: 'Test User',
      email: currentUser.email,
      phone: '+60123456789',
      userType: 'customer',
      vehicles: 0,
      totalBookings: 0
    };
  }
  
  return {
    id: currentUser.uid,
    ...mockDB.users[currentUser.uid]
  };
};

export const saveUserProfile = async (userData) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  mockDB.users[currentUser.uid] = {
    ...mockDB.users[currentUser.uid],
    ...userData,
    updatedAt: serverTimestamp()
  };
  
  return true;
};

// Vehicle Functions
export const addVehicle = async (vehicleData) => {
  if (!currentUser) throw new Error('User not authenticated');
  

  if (!mockDB.vehicles[currentUser.uid]) {
    mockDB.vehicles[currentUser.uid] = [];
  }
  
  const vehicleId = generateId();
  
  mockDB.vehicles[currentUser.uid].push({
    id: vehicleId,
    ...vehicleData,
    createdAt: serverTimestamp()
  });
  
  if (!mockDB.users[currentUser.uid].vehicles) {
    mockDB.users[currentUser.uid].vehicles = 0;
  }
  
  mockDB.users[currentUser.uid].vehicles += 1;
  
  return vehicleId;
};

export const getUserVehicles = async () => {
  if (!currentUser) throw new Error('User not authenticated');
  

  if (!mockDB.vehicles[currentUser.uid] || mockDB.vehicles[currentUser.uid].length === 0) {
    mockDB.vehicles[currentUser.uid] = [
      {
        id: generateId(),
        plateNumber: 'ABC123',
        type: 'sedan',
        brand: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        createdAt: serverTimestamp()
      },
      {
        id: generateId(),
        plateNumber: 'XYZ789',
        type: 'suv',
        brand: 'Honda',
        model: 'CR-V',
        color: 'Black',
        createdAt: serverTimestamp()
      }
    ];
    

    mockDB.users[currentUser.uid].vehicles = 2;
  }
  
  return mockDB.vehicles[currentUser.uid];
};

export const getVehicleDetails = async (vehicleId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const vehicle = mockDB.vehicles[currentUser.uid]?.find(v => v.id === vehicleId);
  
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  
  return vehicle;
};

export const deleteVehicle = async (vehicleId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  if (!mockDB.vehicles[currentUser.uid]) {
    throw new Error('No vehicles found');
  }
  
  const index = mockDB.vehicles[currentUser.uid].findIndex(v => v.id === vehicleId);
  
  if (index === -1) {
    throw new Error('Vehicle not found');
  }
  
  mockDB.vehicles[currentUser.uid].splice(index, 1);
  

  mockDB.users[currentUser.uid].vehicles -= 1;
  
  return true;
};

// Enhanced Time Slot Management
export const getAvailableTimeSlots = async (shopId, date, serviceDuration) => {
  try {

    const shop = shops.find(s => s.id === shopId);
    if (!shop) throw new Error('Shop not found');
    
    const existingBookings = [];
    
    if (mockDB.bookings.global) {
      mockDB.bookings.global.forEach(booking => {
        if (booking.date === date && 
            booking.shopId === shopId && 
            ['pending', 'confirmed', 'completed'].includes(booking.status)) {
          existingBookings.push({
            time: booking.time,
            service: booking.service
          });
        }
      });
    }
    
    const allTimeSlots = generateOptimizedTimeSlots(
      serviceDuration, 
      shop.openingHour, 
      shop.closingHour
    );
    
    const availableSlots = allTimeSlots.filter(slot => {
      return !checkTimeSlotConflicts(existingBookings, slot, serviceDuration);
    });
    
    return availableSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
};

export const checkSlotAvailability = async (shopId, date, time, serviceDuration) => {
  try {
    const existingBookings = [];
    
    if (mockDB.bookings.global) {
      mockDB.bookings.global.forEach(booking => {
        if (booking.date === date && 
            booking.shopId === shopId && 
            ['pending', 'confirmed', 'completed'].includes(booking.status)) {
          existingBookings.push({
            time: booking.time,
            service: booking.service
          });
        }
      });
    }
    
    return !checkTimeSlotConflicts(existingBookings, time, serviceDuration);
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
};

// Auto-confirm bookings that are 30 minutes away
export const autoConfirmPendingBookings = async () => {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
    

    const today = now.toISOString().split('T')[0];
    
    let confirmedCount = 0;
    

    if (mockDB.bookings.global) {
      mockDB.bookings.global.forEach(booking => {
        if (booking.status === 'pending' && booking.date === today) {
          const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
          
          if (bookingDateTime <= thirtyMinutesFromNow) {
            booking.status = 'confirmed';
            booking.autoConfirmedAt = serverTimestamp();
            confirmedCount++;

            if (mockDB.bookings[booking.userId]) {
              const userBooking = mockDB.bookings[booking.userId].find(b => b.id === booking.id);
              if (userBooking) {
                userBooking.status = 'confirmed';
                userBooking.autoConfirmedAt = serverTimestamp();
              }
            }
          }
        }
      });
    }
    
    return confirmedCount;
  } catch (error) {
    console.error("Error auto-confirming bookings:", error);
    throw error;
  }
};

// Booking Functions
export const createBooking = async (bookingDetails) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  if (!mockDB.bookings[currentUser.uid]) {
    mockDB.bookings[currentUser.uid] = [];
  }
  
  const bookingId = generateId();

  const userProfile = await getUserProfile();
  
  const newBooking = {
    id: bookingId,
    userId: currentUser.uid,
    customerName: userProfile.name,
    customerEmail: userProfile.email,
    customerPhone: userProfile.phone,
    shopId: bookingDetails.shopId,
    shopName: bookingDetails.shopName,
    vehicleId: bookingDetails.vehicle.id,
    vehiclePlate: bookingDetails.vehicle.plateNumber,
    vehicleType: bookingDetails.vehicle.type,
    vehicleBrand: bookingDetails.vehicle.brand || '',
    vehicleModel: bookingDetails.vehicle.model || '',
    vehicleColor: bookingDetails.vehicle.color || '',
    service: bookingDetails.service,
    addOns: bookingDetails.addOns || [],
    date: bookingDetails.date,
    time: bookingDetails.time,
    remarks: bookingDetails.remarks || "",
    totalPrice: bookingDetails.totalPrice,
    status: "pending",
    isPaid: false,
    createdAt: serverTimestamp()
  };

  mockDB.bookings[currentUser.uid].push(newBooking);
  

  if (!mockDB.users[currentUser.uid].totalBookings) {
    mockDB.users[currentUser.uid].totalBookings = 0;
  }
  
  mockDB.users[currentUser.uid].totalBookings += 1;
  

  if (!mockDB.bookings.global) {
    mockDB.bookings.global = [];
  }
  
  mockDB.bookings.global.push(newBooking);
  
  return bookingId;
};

export const getBookingDetails = async (bookingId) => {
  if (!currentUser) throw new Error('User not authenticated');
  

  const userBooking = mockDB.bookings[currentUser.uid]?.find(b => b.id === bookingId);
  

  const globalBooking = mockDB.bookings.global?.find(b => b.id === bookingId);
  
  const booking = userBooking || globalBooking;
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  const userProfile = await getUserProfile();
  if (userProfile.userType === 'admin' && userProfile.shopId !== booking.shopId) {
    throw new Error('Unauthorized - booking is for a different shop');
  }
  
  return booking;
};

export const getUserBookingHistory = async () => {
  if (!currentUser) throw new Error('User not authenticated');
  
  if (!mockDB.bookings[currentUser.uid] || mockDB.bookings[currentUser.uid].length === 0) {
    const vehicles = await getUserVehicles();
    
    if (vehicles.length > 0) {
      mockDB.bookings[currentUser.uid] = generateMockBookings(vehicles);
      if (!mockDB.bookings.global) {
        mockDB.bookings.global = [];
      }
      
      mockDB.bookings.global.push(...mockDB.bookings[currentUser.uid]);
      
      mockDB.users[currentUser.uid].totalBookings = mockDB.bookings[currentUser.uid].length;
    }
  }
  
  return mockDB.bookings[currentUser.uid] || [];
};

export const getUpcomingBookings = async () => {
  if (!currentUser) throw new Error('User not authenticated');
  
  await getUserBookingHistory();
  
  const upcomingBookings = mockDB.bookings[currentUser.uid]?.filter(
    b => ['pending', 'confirmed'].includes(b.status) || 
         (b.status === 'completed' && isRecentBooking(b.date))
  ) || [];
  
  upcomingBookings.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA - dateB;
  });
  
  return upcomingBookings.slice(0, 5);
};

const isRecentBooking = (bookingDate) => {
  const booking = new Date(bookingDate);
  const now = new Date();
  const daysDiff = Math.floor((now - booking) / (1000 * 60 * 60 * 24));
  return daysDiff <= 7;
};

export const cancelBooking = async (bookingId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const booking = await getBookingDetails(bookingId);
  if (booking.userId !== currentUser.uid) {
    throw new Error('Unauthorized');
  }
  
  if (booking.isPaid) {
    throw new Error('Cannot cancel booking - payment has been made. Payments are non-refundable.');
  }
  
  const bookingTime = new Date(`${booking.date} ${booking.time}`);
  const now = new Date();
  const diffMinutes = (bookingTime - now) / (1000 * 60);
  
  if (diffMinutes < 30) {
    throw new Error('Cannot cancel less than 30 minutes before appointment');
  }
  
  booking.status = 'cancelled';
  booking.cancelledAt = serverTimestamp();
  booking.cancelledBy = 'customer';

  const userBooking = mockDB.bookings[currentUser.uid]?.find(b => b.id === bookingId);
  if (userBooking) {
    userBooking.status = 'cancelled';
    userBooking.cancelledAt = serverTimestamp();
    userBooking.cancelledBy = 'customer';
  }
  
  return true;
};

export const processPayment = async (bookingId, paymentMethod) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const booking = await getBookingDetails(bookingId);
  
  booking.isPaid = true;
  booking.paymentMethod = paymentMethod;
  booking.paymentDate = serverTimestamp();
  
  const appointmentDateTime = new Date(`${booking.date} ${booking.time}`);
  const now = new Date();
  
  if (booking.status === 'completed') {
  } else if (now >= appointmentDateTime) {
    booking.status = 'completed';
  }
  
  const userBooking = mockDB.bookings[currentUser.uid]?.find(b => b.id === bookingId);
  if (userBooking) {
    userBooking.isPaid = true;
    userBooking.paymentMethod = paymentMethod;
    userBooking.paymentDate = serverTimestamp();
    userBooking.status = booking.status;
  }
  
  if (!mockDB.payments[currentUser.uid]) {
    mockDB.payments[currentUser.uid] = [];
  }
  
  mockDB.payments[currentUser.uid].push({
    id: generateId(),
    bookingId,
    userId: currentUser.uid,
    amount: booking.totalPrice,
    method: paymentMethod,
    timestamp: serverTimestamp()
  });
  
  return true;
};

export const submitFeedback = async (bookingId, feedbackData) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const booking = await getBookingDetails(bookingId);

  booking.feedback = feedbackData;
  
  const userBooking = mockDB.bookings[currentUser.uid]?.find(b => b.id === bookingId);
  if (userBooking) {
    userBooking.feedback = feedbackData;
  }
  
  if (!mockDB.feedback[currentUser.uid]) {
    mockDB.feedback[currentUser.uid] = [];
  }
  
  mockDB.feedback[currentUser.uid].push({
    id: generateId(),
    bookingId,
    userId: currentUser.uid,
    ...feedbackData,
    createdAt: serverTimestamp()
  });
  
  return true;
};

// Admin Functions
export const getAdminShopBookings = async (shopId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const userProfile = await getUserProfile();
  if (userProfile.userType !== 'admin' || userProfile.shopId !== shopId) {
    throw new Error('Unauthorized');
  }

  await autoConfirmPendingBookings();

  if (!mockDB.bookings.global || mockDB.bookings.global.length === 0) {
    mockDB.bookings.global = [];
    
    for (let i = 0; i < 15; i++) {
      const mockBooking = generateRandomBooking(shopId);
      mockDB.bookings.global.push(mockBooking);
    }
  }
  
  return mockDB.bookings.global.filter(b => b.shopId === shopId);
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  if (!currentUser) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();
  if (userProfile.userType !== 'admin') {
    throw new Error('Unauthorized');
  }

  const booking = mockDB.bookings.global?.find(b => b.id === bookingId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.shopId !== userProfile.shopId) {
    throw new Error('Unauthorized - booking is for a different shop');
  }

  booking.status = newStatus;
  booking.updatedAt = serverTimestamp();
  booking.updatedBy = currentUser.uid;

  if (newStatus === 'cancelled' || newStatus === 'rejected') {
    booking.cancelledBy = 'admin';
  }

  const userBooking = mockDB.bookings[booking.userId]?.find(b => b.id === bookingId);
  if (userBooking) {
    userBooking.status = newStatus;
    userBooking.updatedAt = serverTimestamp();
    userBooking.updatedBy = currentUser.uid;
    
    if (newStatus === 'cancelled' || newStatus === 'rejected') {
      userBooking.cancelledBy = 'admin';
    }
  }
  
  return true;
};

export const getAdminCustomers = async () => {
  if (!currentUser) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();
  if (userProfile.userType !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  const shopId = userProfile.shopId;

  if (Object.keys(mockDB.users).length <= 1) {

    for (let i = 0; i < 8; i++) {
      const customerId = generateId();
      mockDB.users[customerId] = {
        id: customerId,
        name: `Customer ${i+1}`,
        email: `customer${i+1}@example.com`,
        phone: `+6012345678${i}`,
        userType: 'customer',
        vehicles: Math.floor(Math.random() * 3) + 1,
        totalBookings: Math.floor(Math.random() * 8) + 1,
        createdAt: serverTimestamp()
      };

      if (!mockDB.bookings[customerId]) {
        mockDB.bookings[customerId] = [];
      }
      
      for (let j = 0; j < mockDB.users[customerId].totalBookings; j++) {
        const booking = generateRandomBooking(shopId, customerId);
        mockDB.bookings[customerId].push(booking);

        if (!mockDB.bookings.global) {
          mockDB.bookings.global = [];
        }
        mockDB.bookings.global.push(booking);
      }
    }
  }
  

  const customers = [];

  const shopBookings = mockDB.bookings.global?.filter(b => b.shopId === shopId) || [];

  const customerIds = [...new Set(shopBookings.map(b => b.userId))];

  for (const customerId of customerIds) {
    if (mockDB.users[customerId] && mockDB.users[customerId].userType === 'customer') {
      const bookingsCount = shopBookings.filter(b => b.userId === customerId).length;
      
      customers.push({
        id: customerId,
        ...mockDB.users[customerId],
        totalBookings: bookingsCount
      });
    }
  }
  
  return customers;
};

export const getAdminCustomerDetails = async (customerId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const userProfile = await getUserProfile();
  if (userProfile.userType !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  const shopId = userProfile.shopId;
  
  const customer = mockDB.users[customerId];
  if (!customer || customer.userType !== 'customer') {
    throw new Error('Customer not found');
  }

  const customerBookings = mockDB.bookings.global?.filter(
    b => b.userId === customerId && b.shopId === shopId
  ) || [];

  const customerVehicles = mockDB.vehicles[customerId] || [];
  
  return {
    customer: { id: customerId, ...customer },
    bookings: customerBookings,
    vehicles: customerVehicles
  };
};

export const getAdminBookingHistory = async (shopId, status = null, startDate = null, endDate = null) => {
  if (!currentUser) throw new Error('User not authenticated');

  const userProfile = await getUserProfile();
  if (userProfile.userType !== 'admin' || userProfile.shopId !== shopId) {
    throw new Error('Unauthorized');
  }

  let shopBookings = mockDB.bookings.global?.filter(b => b.shopId === shopId) || [];

  if (status) {
    shopBookings = shopBookings.filter(b => b.status === status);
  }
  
  if (startDate) {
    shopBookings = shopBookings.filter(b => b.date >= startDate);
  }
  
  if (endDate) {
    shopBookings = shopBookings.filter(b => b.date <= endDate);
  }

  shopBookings.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB - dateA;
  });
  
  return shopBookings;
};

export const getVehicleBookingHistory = async (vehicleId) => {
  if (!currentUser) throw new Error('User not authenticated');
  
  const bookings = mockDB.bookings[currentUser.uid] || [];
  return bookings.filter(b => b.vehicleId === vehicleId);
};

// Helper functions for mock data generation
function generateRandomBooking(shopId, userId = null) {
  const id = generateId();
  const mockCustomerId = userId || generateId();
  
  if (!userId && !mockDB.users[mockCustomerId]) {
    mockDB.users[mockCustomerId] = {
      id: mockCustomerId,
      name: `Customer ${Math.floor(Math.random() * 100)}`,
      email: `customer${Math.floor(Math.random() * 100)}@example.com`,
      phone: `+6012${Math.floor(1000000 + Math.random() * 9000000)}`,
      userType: 'customer',
      vehicles: 1,
      totalBookings: 1,
      createdAt: serverTimestamp()
    };
  }

  const shop = shops.find(s => s.id === shopId);

  const shopServices = services[shopId] || [];
  const randomService = shopServices[Math.floor(Math.random() * shopServices.length)];

  const today = new Date();
  const randomDays = Math.floor(Math.random() * 30) - 15; 
  const randomDate = new Date();
  randomDate.setDate(today.getDate() + randomDays);

  const formattedDate = randomDate.toISOString().split('T')[0];

  if (randomService) {
    const availableSlots = generateOptimizedTimeSlots(randomService.duration, shop.openingHour, shop.closingHour);
    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
    const statusWeights = [0.2, 0.3, 0.35, 0.1, 0.05];
    
    let randomStatus = 'completed';
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statusOptions.length; i++) {
      cumulative += statusWeights[i];
      if (rand <= cumulative) {
        randomStatus = statusOptions[i];
        break;
      }
    }
    
    if (randomDate > today) {
      randomStatus = Math.random() > 0.7 ? 'pending' : 'confirmed';
    }
    
    const vehicleId = generateId();
    const vehiclePlate = `ABC${Math.floor(100 + Math.random() * 900)}`;
    const vehicleTypes = ['sedan', 'hatchback', 'suv', 'mpv'];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    
    return {
      id,
      userId: mockCustomerId,
      customerName: mockDB.users[mockCustomerId].name,
      customerEmail: mockDB.users[mockCustomerId].email,
      customerPhone: mockDB.users[mockCustomerId].phone,
      shopId,
      shopName: shop?.name || 'Unknown Shop',
      vehicleId,
      vehiclePlate,
      vehicleType,
      vehicleBrand: 'Toyota',
      vehicleModel: 'Camry',
      vehicleColor: 'Black',
      service: randomService,
      date: formattedDate,
      time: randomSlot,
      totalPrice: randomService.price,
      status: randomStatus,
      isPaid: randomStatus === 'completed' || (Math.random() > 0.7),
      createdAt: serverTimestamp()
    };
  }
  return null;
}

function generateMockBookings(vehicles) {
  const mockBookings = [];

  const randomShopIndex = Math.floor(Math.random() * shops.length);
  const randomShop = shops[randomShopIndex];
  const shopServices = services[randomShop.id] || [];
  const bookingCount = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < bookingCount; i++) {
    const randomVehicleIndex = Math.floor(Math.random() * vehicles.length);
    const randomVehicle = vehicles[randomVehicleIndex];
    const randomServiceIndex = Math.floor(Math.random() * shopServices.length);
    const randomService = shopServices[randomServiceIndex];
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 30) - 10;
    const randomDate = new Date();
    randomDate.setDate(today.getDate() + randomDays);
    
    const formattedDate = randomDate.toISOString().split('T')[0];
    const availableSlots = generateOptimizedTimeSlots(randomService.duration, randomShop.openingHour, randomShop.closingHour);
    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    let randomStatus;
    if (randomDate > today) {
      randomStatus = Math.random() > 0.5 ? 'pending' : 'confirmed';
    } else {
      randomStatus = 'completed';
    }
    
    mockBookings.push({
      id: generateId(),
      userId: currentUser.uid,
      customerName: mockDB.users[currentUser.uid].name,
      customerEmail: currentUser.email,
      customerPhone: mockDB.users[currentUser.uid].phone,
      shopId: randomShop.id,
      shopName: randomShop.name,
      vehicleId: randomVehicle.id,
      vehiclePlate: randomVehicle.plateNumber,
      vehicleType: randomVehicle.type,
      vehicleBrand: randomVehicle.brand || '',
      vehicleModel: randomVehicle.model || '',
      vehicleColor: randomVehicle.color || '',
      service: randomService,
      date: formattedDate,
      time: randomSlot,
      totalPrice: randomService.price,
      status: randomStatus,
      isPaid: randomStatus === 'completed',
      createdAt: serverTimestamp()
    });
  }
  
  return mockBookings;
}