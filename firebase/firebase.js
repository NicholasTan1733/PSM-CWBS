import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { Dimensions } from 'react-native';

import { 
  initializeAuth, 
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAhfrnVHgYWZy9Kp-KZPcv__gdIK6DGOcg",
  authDomain: "carwashbookingsystem.firebaseapp.com",
  projectId: "carwashbookingsystem",
  storageBucket: "carwashbookingsystem.firebasestorage.app",
  messagingSenderId: "42745596783",
  appId: "1:42745596783:web:08dd0c691a90c13d0ff69a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


const db = getFirestore(app);

export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const logIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (userDoc.exists() && userDoc.data().userType === 'admin') {
      await firebaseSignOut(auth);
      throw new Error("This is an admin account. Please use admin login.");
    }
    
    return userCredential;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const loginAsAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists() || userDoc.data().userType !== 'admin') {
      await firebaseSignOut(auth);
      return null;
    }
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      ...userDoc.data()
    };
  } catch (error) {
    console.error("Error during admin login:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error during password reset:", error);
    throw error;
  }
};

export const loginWithUserType = async (email, password, expectedUserType = null) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await firebaseSignOut(auth);
      throw new Error('User profile not found');
    }
    
    const userData = userDoc.data();
    
    if (expectedUserType && userData.userType !== expectedUserType) {
      await firebaseSignOut(auth);
      throw new Error(`Access denied. This login is for ${expectedUserType}s only.`);
    }
    
    return {
      user,
      userData
    };
    
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const saveUserProfile = async (userData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const vehicleRef = collection(db, "users", user.uid, "vehicles");
    const newVehicleRef = await addDoc(vehicleRef, {
      ...vehicleData,
      createdAt: serverTimestamp()
    });
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      await updateDoc(userRef, {
        vehicles: (userData.vehicles || 0) + 1
      });
    }
    
    return newVehicleRef.id;
  } catch (error) {
    console.error("Error adding vehicle:", error);
    throw error;
  }
};

export const getUserVehicles = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const vehiclesRef = collection(db, "users", user.uid, "vehicles");
    const q = query(vehiclesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const vehicles = [];
    querySnapshot.forEach((doc) => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return vehicles;
  } catch (error) {
    console.error("Error getting vehicles:", error);
    throw error;
  }
};

export const getVehicleDetails = async (vehicleId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const vehicleRef = doc(db, "users", user.uid, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);
    
    if (vehicleSnap.exists()) {
      return {
        id: vehicleSnap.id,
        ...vehicleSnap.data()
      };
    } else {
      throw new Error("Vehicle not found");
    }
  } catch (error) {
    console.error("Error getting vehicle details:", error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const vehicleRef = doc(db, "users", user.uid, "vehicles", vehicleId);
    await updateDoc(vehicleRef, {
      ...vehicleData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const vehicleRef = doc(db, "users", user.uid, "vehicles", vehicleId);
    await deleteDoc(vehicleRef);
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      await updateDoc(userRef, {
        vehicles: Math.max((userData.vehicles || 1) - 1, 0)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Get user profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found");
    const userData = userDoc.data();
    
    // Get vehicle details if vehicleId is provided
    let vehicleInfo = {};
    if (bookingData.vehicle?.id) {
      try {
        const vehicleDetails = await getVehicleDetails(bookingData.vehicle.id);
        vehicleInfo = {
          vehiclePlate: vehicleDetails.plateNumber,
          vehicleType: vehicleDetails.type,
          vehicleBrand: vehicleDetails.brand,
          vehicleModel: vehicleDetails.model,
          vehicleColor: vehicleDetails.color
        };
      } catch (error) {
        console.error("Error getting vehicle details:", error);
        vehicleInfo = {
          vehiclePlate: bookingData.vehicle.plateNumber || 'N/A',
          vehicleType: bookingData.vehicle.type || 'N/A',
          vehicleBrand: bookingData.vehicle.brand || '',
          vehicleModel: bookingData.vehicle.model || '',
          vehicleColor: bookingData.vehicle.color || ''
        };
      }
    }
    
    const isAvailable = await checkSlotAvailability(
      bookingData.shopId, 
      bookingData.date, 
      bookingData.time, 
      bookingData.service?.duration || 60
    );
    
    if (!isAvailable) {
      throw new Error("Selected time slot is not available");
    }
    
    // Check if shop has auto-accept enabled
    let initialStatus = "pending";
    let autoAccepted = false;
    
    if (bookingData.shopId) {
      // Check shop admin settings for auto-accept
      const adminQuery = query(
        collection(db, "users"),
        where("shopId", "==", bookingData.shopId),
        where("userType", "==", "admin"),
        limit(1)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();
        if (adminData.settings?.autoAcceptBookings === true) {
          initialStatus = "confirmed";
          autoAccepted = true;
        }
      }
      
      // Alternative: If you have shops collection with settings
      try {
        const shopDoc = await getDoc(doc(db, "shops", bookingData.shopId));
        if (shopDoc.exists() && shopDoc.data().autoAcceptBookings === true) {
          initialStatus = "confirmed";
          autoAccepted = true;
        }
      } catch (error) {
        // Shop document might not exist, continue with admin settings
      }
    }
    
    const bookingRef = collection(db, "bookings");
    const newBookingRef = await addDoc(bookingRef, {
      ...bookingData,
      ...vehicleInfo,
      userId: user.uid,
      customerName: userData.name || userData.email,
      customerPhone: userData.phone || '',
      customerEmail: userData.email,
      status: initialStatus, // Will be "confirmed" if auto-accept is enabled
      autoAccepted: autoAccepted, // Track if this was auto-accepted
      isPaid: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newBookingRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};


export const checkSlotAvailability = async (shopId, date, time, serviceDuration = 60) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("shopId", "==", shopId),
      where("date", "==", date),
      where("status", "in", ["confirmed", "pending"])
    );
    
    const querySnapshot = await getDocs(q);
    
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const requestStartMinutes = timeToMinutes(time);
    const requestEndMinutes = requestStartMinutes + serviceDuration;
    
    for (const doc of querySnapshot.docs) {
      const booking = doc.data();
      const bookingStartMinutes = timeToMinutes(booking.time);
      const bookingEndMinutes = bookingStartMinutes + (booking.service?.duration || 60);
      
      if (requestStartMinutes < bookingEndMinutes && requestEndMinutes > bookingStartMinutes) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
};

export const getBookingDetails = async (bookingId) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      return {
        id: bookingSnap.id,
        ...bookingSnap.data()
      };
    } else {
      throw new Error("Booking not found");
    }
  } catch (error) {
    console.error("Error getting booking details:", error);
    throw error;
  }
};

export const cancelBookingWithRefund = async (bookingId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    
    const bookingData = bookingSnap.data();
    
    if (bookingData.userId !== user.uid) throw new Error("Unauthorized");
    
    if (bookingData.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }
    
    if (bookingData.status === "completed") {
      throw new Error("Cannot cancel completed booking. Payments are non-refundable.");
    }
    
    const bookingDateTime = new Date(`${bookingData.date} ${bookingData.time}`);
    const now = new Date();
    const diffMs = bookingDateTime - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 30) {
      throw new Error("Cannot cancel less than 30 minutes before appointment");
    }
    
    await updateDoc(bookingRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancelledBy: "customer"
    });
    
    return true;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

export const getUserBookingHistory = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting user booking history:", error);
    throw error;
  }
};

export const getAvailableTimeSlots = async (shopId, date, serviceDuration = 60) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("shopId", "==", shopId),
      where("date", "==", date),
      where("status", "in", ["confirmed", "pending"])
    );
    
    const querySnapshot = await getDocs(q);
    const bookedTimes = [];
    
    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      bookedTimes.push({
        time: booking.time,
        duration: booking.service?.duration || 60
      });
    });
    
    const allSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const availableSlots = allSlots.filter(slot => {
      const slotStartMinutes = timeToMinutes(slot);
      const slotEndMinutes = slotStartMinutes + serviceDuration;
      
      return !bookedTimes.some(booking => {
        const bookingStartMinutes = timeToMinutes(booking.time);
        const bookingEndMinutes = bookingStartMinutes + booking.duration;
        
        return (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes);
      });
    });
    
    return availableSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
};

export const submitFeedback = async (bookingId, feedbackData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      feedback: feedbackData,
      updatedAt: serverTimestamp()
    });
    
    const feedbackRef = collection(db, "feedback");
    await addDoc(feedbackRef, {
      bookingId: bookingId,
      userId: user.uid,
      ...feedbackData,
      createdAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

export const getUpcomingBookings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const today = new Date().toISOString().split('T')[0];
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", user.uid),
      where("date", ">=", today),
      where("status", "in", ["pending", "confirmed"]),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting upcoming bookings:", error);
    throw error;
  }
};

export const processPaymentWithHold = async (bookingId, paymentMethod) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    
    const bookingData = bookingSnap.data();
    
    if (bookingData.userId !== user.uid) throw new Error("Unauthorized");
    
    if (bookingData.isPaid) throw new Error("Booking is already paid");
    
    let newStatus = bookingData.status;
    
    if (bookingData.status === 'pending' || bookingData.status === 'confirmed') {
      const appointmentDateTime = new Date(`${bookingData.date} ${bookingData.time}`);
      const now = new Date();
      
      if (now >= appointmentDateTime) {
        newStatus = 'completed';
      }
    } else if (bookingData.status === 'completed') {
      newStatus = 'completed';
    }
    
    await updateDoc(bookingRef, {
      isPaid: true,
      paymentMethod: paymentMethod,
      paymentDate: serverTimestamp(),
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    const paymentsRef = collection(db, "payments");
    await addDoc(paymentsRef, {
      bookingId: bookingId,
      userId: user.uid,
      amount: bookingData.totalPrice,
      method: paymentMethod,
      timestamp: serverTimestamp()
    });
    
    return {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      amount: bookingData.totalPrice,
      method: paymentMethod
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

export const getAdminBookingHistory = async () => {
  try {
    // This uses the same function as getBookingsForAdmin
    // but you can filter for completed/cancelled bookings
    const allBookings = await getBookingsForAdmin();
    
    // Return all bookings sorted by date
    return allBookings.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error getting admin booking history:", error);
    throw error;
  }
};

export const getBookingsForAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Get user data to find their shop
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().userType !== 'admin') {
      throw new Error("Unauthorized - Admin access required");
    }
    
    const userData = userDoc.data();
    const shopId = userData.shopId || userData.shopName; // Use shopId or shopName
    
    // Get all bookings for this shop
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("shopId", "==", shopId),
      orderBy("date", "desc"),
      orderBy("time", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        // Ensure all required fields exist
        customerName: data.customerName || data.userName || 'Unknown',
        vehicleMake: data.vehicleMake || data.vehicle?.make || '',
        vehicleModel: data.vehicleModel || data.vehicle?.model || '',
        vehicleNumber: data.vehicleNumber || data.vehicle?.plateNumber || '',
        services: data.services || [],
        totalAmount: data.totalAmount || data.totalPrice || 0,
        status: data.status || 'pending'
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting bookings for admin:", error);
    throw error;
  }
};

export const getAdminCustomers = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Verify admin access
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().userType !== 'admin') {
      throw new Error("Unauthorized - Admin access required");
    }
    
    const userData = userDoc.data();
    const shopId = userData.shopId || userData.shopName;
    
    // Get all bookings for this shop to find customers
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("shopId", "==", shopId)
    );
    
    const querySnapshot = await getDocs(q);
    const customerMap = new Map();
    
    // Build customer list from bookings
    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      const customerId = booking.userId || booking.customerId;
      
      if (customerId && !customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: booking.customerName || booking.userName || 'Unknown',
          email: booking.customerEmail || booking.userEmail || '',
          phone: booking.customerPhone || booking.userPhone || '',
          firstBookingDate: booking.date,
          lastBookingDate: booking.date,
          totalBookings: 1,
          totalSpent: parseFloat(booking.totalAmount) || parseFloat(booking.totalPrice) || 0,
          status: 'active'
        });
      } else if (customerId) {
        const customer = customerMap.get(customerId);
        customer.totalBookings += 1;
        customer.totalSpent += parseFloat(booking.totalAmount) || parseFloat(booking.totalPrice) || 0;
        customer.lastBookingDate = booking.date > customer.lastBookingDate ? booking.date : customer.lastBookingDate;
      }
    });
    
    // Try to get additional customer data from users collection
    const customers = [];
    for (const [customerId, customerData] of customerMap) {
      try {
        const userDoc = await getDoc(doc(db, "users", customerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          customers.push({
            ...customerData,
            name: userData.name || customerData.name,
            email: userData.email || customerData.email,
            phone: userData.phone || customerData.phone,
            joinDate: userData.createdAt || customerData.firstBookingDate,
            averageRating: 4.5 + Math.random() * 0.5 // Mock rating
          });
        } else {
          customers.push(customerData);
        }
      } catch (error) {
        customers.push(customerData);
      }
    }
    
    return customers;
  } catch (error) {
    console.error("Error getting admin customers:", error);
    throw error;
  }
};

export const getAdminCustomerDetails = async (userId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().userType !== 'admin') {
      throw new Error("Unauthorized - Admin access required");
    }
    
    const customerRef = doc(db, "users", userId);
    const customerSnap = await getDoc(customerRef);
    
    if (!customerSnap.exists()) {
      throw new Error("Customer not found");
    }
    
    const customerData = customerSnap.data();
    
    const bookingsRef = collection(db, "bookings");
    const bookingsQuery = query(
      bookingsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const bookings = [];
    bookingsSnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const vehiclesRef = collection(db, "users", userId, "vehicles");
    const vehiclesSnapshot = await getDocs(vehiclesRef);
    
    const vehicles = [];
    vehiclesSnapshot.forEach((doc) => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      customer: {
        id: customerSnap.id,
        ...customerData
      },
      bookings,
      vehicles,
      stats: {
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        totalSpent: bookings
          .filter(b => b.status === 'completed' && b.isPaid)
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      }
    };
  } catch (error) {
    console.error("Error getting admin customer details:", error);
    throw error;
  }
};

export const getUserBookings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef, 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting user bookings:", error);
    throw error;
  }
};

export const updateBooking = async (bookingId, bookingData) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      ...bookingData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const getVehicleBookingHistory = async (vehicleId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", user.uid),
      where("vehicleId", "==", vehicleId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting vehicle booking history:", error);
    throw error;
  }
};

export const getRecentBookings = async (limitCount = 10) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting recent bookings:", error);
    throw error;
  }
};

export const getAllBookings = async () => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting all bookings:", error);
    throw error;
  }
};

export const getBookingsByStatus = async (status) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting bookings by status:", error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const bookingsRef = collection(db, "bookings");
    const usersRef = collection(db, "users");
    
    const [bookingsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(bookingsRef),
      getDocs(usersRef)
    ]);
    
    const totalBookings = bookingsSnapshot.size;
    const totalUsers = usersSnapshot.size;
    
    let pendingBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;
    
    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      switch (booking.status) {
        case 'pending':
          pendingBookings++;
          break;
        case 'completed':
          completedBookings++;
          totalRevenue += booking.totalPrice || 0;
          break;
        case 'cancelled':
          cancelledBookings++;
          break;
      }
    });
    
    return {
      totalBookings,
      totalUsers,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
};

export const addShop = async (shopData) => {
  try {
    const shopsRef = collection(db, "shops");
    const newShopRef = await addDoc(shopsRef, {
      ...shopData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newShopRef.id;
  } catch (error) {
    console.error("Error adding shop:", error);
    throw error;
  }
};

export const getAllShops = async () => {
  try {
    const shopsRef = collection(db, "shops");
    const q = query(shopsRef, orderBy("name"));
    const querySnapshot = await getDocs(q);
    
    const shops = [];
    querySnapshot.forEach((doc) => {
      shops.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return shops;
  } catch (error) {
    console.error("Error getting all shops:", error);
    throw error;
  }
};

export const getShopById = async (shopId) => {
  try {
    const shopRef = doc(db, "shops", shopId);
    const shopSnap = await getDoc(shopRef);
    
    if (shopSnap.exists()) {
      return {
        id: shopSnap.id,
        ...shopSnap.data()
      };
    } else {
      throw new Error("Shop not found");
    }
  } catch (error) {
    console.error("Error getting shop by ID:", error);
    throw error;
  }
};

export const updateShop = async (shopId, shopData) => {
  try {
    const shopRef = doc(db, "shops", shopId);
    await updateDoc(shopRef, {
      ...shopData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating shop:", error);
    throw error;
  }
};

export const deleteShop = async (shopId) => {
  try {
    const shopRef = doc(db, "shops", shopId);
    await deleteDoc(shopRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting shop:", error);
    throw error;
  }
};

export const addService = async (serviceData) => {
  try {
    const servicesRef = collection(db, "services");
    const newServiceRef = await addDoc(servicesRef, {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newServiceRef.id;
  } catch (error) {
    console.error("Error adding service:", error);
    throw error;
  }
};

export const getAllServices = async () => {
  try {
    const servicesRef = collection(db, "services");
    const q = query(servicesRef, orderBy("name"));
    const querySnapshot = await getDocs(q);
    
    const services = [];
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return services;
  } catch (error) {
    console.error("Error getting all services:", error);
    throw error;
  }
};

export const getServiceById = async (serviceId) => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (serviceSnap.exists()) {
      return {
        id: serviceSnap.id,
        ...serviceSnap.data()
      };
    } else {
      throw new Error("Service not found");
    }
  } catch (error) {
    console.error("Error getting service by ID:", error);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await deleteDoc(serviceRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

export const addReview = async (reviewData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const reviewsRef = collection(db, "reviews");
    const newReviewRef = await addDoc(reviewsRef, {
      ...reviewData,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    
    return newReviewRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

export const getShopReviews = async (shopId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("shopId", "==", shopId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reviews;
  } catch (error) {
    console.error("Error getting shop reviews:", error);
    throw error;
  }
};

export const getUserReviews = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reviews;
  } catch (error) {
    console.error("Error getting user reviews:", error);
    throw error;
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      ...reviewData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await deleteDoc(reviewRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

export const addToFavorites = async (shopId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      favorites: arrayUnion(shopId),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
};

export const removeFromFavorites = async (shopId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(shopId),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
};

export const getUserFavorites = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.favorites || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting user favorites:", error);
    throw error;
  }
};

export const batchUpdateBookings = async (updates) => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach((update) => {
      const bookingRef = doc(db, "bookings", update.id);
      batch.update(bookingRef, {
        ...update.data,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error batch updating bookings:", error);
    throw error;
  }
};

export const autoConfirmPendingBookings = async () => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("status", "==", "pending")
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
      const now = new Date();
      
      if (now >= bookingDateTime) {
        batch.update(doc.ref, {
          status: "confirmed",
          autoConfirmed: true,
          updatedAt: serverTimestamp()
        });
      }
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error auto-confirming pending bookings:", error);
    throw error;
  }
};

export const processPayment = async (bookingId, paymentMethod) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    
    const bookingData = bookingSnap.data();
    
    if (bookingData.userId !== user.uid) throw new Error("Unauthorized");
    
    if (bookingData.isPaid) throw new Error("Booking is already paid");
    
    let newStatus = bookingData.status;
    
    if (bookingData.status === 'pending' || bookingData.status === 'confirmed') {
      const appointmentDateTime = new Date(`${bookingData.date} ${bookingData.time}`);
      const now = new Date();
      
      if (now >= appointmentDateTime) {
        newStatus = 'completed';
      }
    } else if (bookingData.status === 'completed') {
      newStatus = 'completed';
    }
    
    await updateDoc(bookingRef, {
      isPaid: true,
      paymentMethod: paymentMethod,
      paymentDate: serverTimestamp(),
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    const paymentsRef = collection(db, "payments");
    await addDoc(paymentsRef, {
      bookingId: bookingId,
      userId: user.uid,
      amount: bookingData.totalPrice,
      method: paymentMethod,
      timestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

export const getAdminShopBookings = async (shopId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().userType !== 'admin' || userDoc.data().shopId !== shopId) {
      throw new Error("Unauthorized");
    }
    
    await autoConfirmPendingBookings();
    
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("shopId", "==", shopId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error("Error getting admin shop bookings:", error);
    throw error;
  }
};

export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};


export const getUserData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};


export const updateUserSettings = async (settings) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      settings: {
        ...settings,
        updatedAt: serverTimestamp()
      }
    });
    
    return true;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};
export { app, auth, db };