import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ==========================================
// 1. USERS COLLECTION (Firestore 'users')
// ==========================================

/**
 * Creates or updates user profile in Firestore
 */
export const saveOrUpdateUser = async (firebaseUser, additionalData = {}) => {
  if (!firebaseUser?.uid) return null;

  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  const now = new Date().toISOString();

  if (!userSnap.exists()) {
    // New User Document
    const newUserData = {
      uid: firebaseUser.uid,
      name: additionalData.name || firebaseUser.displayName || 'Customer',
      email: firebaseUser.email || '',
      phone: additionalData.phone || firebaseUser.phoneNumber || '',
      photoURL: firebaseUser.photoURL || '',
      role: 'customer',
      createdAt: serverTimestamp(),
      createdAtIso: now,
      lastLogin: serverTimestamp(),
      lastLoginIso: now,
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    };

    await setDoc(userRef, newUserData);
    return { ...newUserData, id: firebaseUser.uid };
  } else {
    // Existing User Document - update lastLogin and any provided profile fields
    const existingData = userSnap.data();
    const updateData = {
      lastLogin: serverTimestamp(),
      lastLoginIso: now,
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    };

    // Only update name/phone if explicitly passed in or not yet set
    if (additionalData.name && additionalData.name !== existingData.name) {
      updateData.name = additionalData.name;
    }
    if (additionalData.phone && additionalData.phone !== existingData.phone) {
      updateData.phone = additionalData.phone;
    }
    if (firebaseUser.photoURL && !existingData.photoURL) {
      updateData.photoURL = firebaseUser.photoURL;
    }

    await updateDoc(userRef, updateData);
    return { ...existingData, ...updateData, id: firebaseUser.uid };
  }
};

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
};

/**
 * Update user profile details
 */
export const updateUserProfile = async (uid, updateFields) => {
  if (!uid) throw new Error('User UID is required');
  try {
    const userRef = doc(db, 'users', uid);
    const cleanUpdates = {
      ...updateFields,
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    };
    await updateDoc(userRef, cleanUpdates);
    return cleanUpdates;
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    throw error;
  }
};

// ==========================================
// 2. ADDRESSES COLLECTION (Firestore 'addresses')
// ==========================================

/**
 * Get all saved addresses for a specific customer
 */
export const getUserAddresses = async (uid) => {
  if (!uid) return [];
  try {
    const addressesRef = collection(db, 'addresses');
    const q = query(addressesRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    const addresses = [];
    querySnapshot.forEach((docSnap) => {
      addresses.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort client-side by createdAt descending to avoid composite index requirement issues
    return addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      const dateA = new Date(a.createdAtIso || 0).getTime();
      const dateB = new Date(b.createdAtIso || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting addresses from Firestore:', error);
    return [];
  }
};

/**
 * Add a new saved address
 */
export const addAddress = async (uid, addressData) => {
  if (!uid) throw new Error('User UID is required');

  try {
    const now = new Date().toISOString();
    const addressesRef = collection(db, 'addresses');

    // If this address is set as default, clear default status from others
    if (addressData.isDefault) {
      await clearDefaultAddress(uid);
    }

    const docRef = doc(addressesRef);
    const newAddress = {
      id: docRef.id,
      uid,
      name: addressData.name?.trim() || '',
      phone: addressData.phone?.trim() || '',
      addressLine1: addressData.addressLine1?.trim() || '',
      addressLine2: addressData.addressLine2?.trim() || '',
      city: addressData.city?.trim() || '',
      state: addressData.state?.trim() || 'Tamil Nadu',
      pincode: addressData.pincode?.trim() || '',
      type: addressData.type || 'home', // 'home' | 'office' | 'other'
      isDefault: Boolean(addressData.isDefault),
      createdAt: serverTimestamp(),
      createdAtIso: now,
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    };

    await setDoc(docRef, newAddress);
    return newAddress;
  } catch (error) {
    console.error('Error adding address to Firestore:', error);
    throw error;
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (addressId, addressData, uid) => {
  if (!addressId) throw new Error('Address ID is required');

  try {
    const addressRef = doc(db, 'addresses', addressId);

    if (addressData.isDefault && uid) {
      await clearDefaultAddress(uid, addressId);
    }

    const updates = {
      name: addressData.name?.trim() || '',
      phone: addressData.phone?.trim() || '',
      addressLine1: addressData.addressLine1?.trim() || '',
      addressLine2: addressData.addressLine2?.trim() || '',
      city: addressData.city?.trim() || '',
      state: addressData.state?.trim() || 'Tamil Nadu',
      pincode: addressData.pincode?.trim() || '',
      type: addressData.type || 'home',
      isDefault: Boolean(addressData.isDefault),
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    };

    await updateDoc(addressRef, updates);
    return { id: addressId, ...updates };
  } catch (error) {
    console.error('Error updating address in Firestore:', error);
    throw error;
  }
};

/**
 * Delete a saved address
 */
export const deleteAddress = async (addressId) => {
  if (!addressId) throw new Error('Address ID is required');
  try {
    const addressRef = doc(db, 'addresses', addressId);
    await deleteDoc(addressRef);
    return true;
  } catch (error) {
    console.error('Error deleting address from Firestore:', error);
    throw error;
  }
};

/**
 * Set an address as default and unmark others
 */
export const setDefaultAddress = async (uid, addressId) => {
  if (!uid || !addressId) throw new Error('UID and Address ID are required');

  try {
    await clearDefaultAddress(uid, addressId);
    const targetRef = doc(db, 'addresses', addressId);
    await updateDoc(targetRef, {
      isDefault: true,
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

/**
 * Helper to unmark default on all user addresses except optionally one
 */
const clearDefaultAddress = async (uid, excludeAddressId = null) => {
  const addressesRef = collection(db, 'addresses');
  const q = query(addressesRef, where('uid', '==', uid));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  let batchCount = 0;

  snap.forEach((docSnap) => {
    if (docSnap.id !== excludeAddressId && docSnap.data().isDefault) {
      batch.update(docSnap.ref, {
        isDefault: false,
        updatedAt: serverTimestamp(),
      });
      batchCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }
};

// ==========================================
// 3. ORDERS COLLECTION (Firestore 'orders')
// ==========================================

/**
 * Save customer order reference in Firestore
 */
export const saveOrderToFirestore = async (orderData, uid) => {
  if (!orderData || !orderData.orderId) return null;

  try {
    const orderDocRef = doc(db, 'orders', orderData.orderId);
    const now = new Date().toISOString();

    const firestoreOrder = {
      orderId: orderData.orderId,
      uid: uid || orderData.uid || '',
      items: (orderData.items || []).map((item) => ({
        productId: String(item.productId || ''),
        name: item.name || '',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        subtotal: Number(item.subtotal) || (Number(item.price) * Number(item.quantity)),
        image: item.image || '',
      })),
      amount: Number(orderData.totalAmount || orderData.amount) || 0,
      totalAmount: Number(orderData.totalAmount || orderData.amount) || 0,
      subtotal: Number(orderData.subtotal) || 0,
      deliveryFee: Number(orderData.deliveryFee) || 0,
      paymentMethod: orderData.paymentMethod || 'COD',
      status: orderData.status || 'Pending',
      customerDetails: {
        name: orderData.customerDetails?.name || '',
        phone: orderData.customerDetails?.phone || '',
        altPhone: orderData.customerDetails?.altPhone || '',
        email: orderData.customerDetails?.email || '',
        address: orderData.customerDetails?.address || '',
        city: orderData.customerDetails?.city || '',
        pincode: orderData.customerDetails?.pincode || '',
        landmark: orderData.customerDetails?.landmark || '',
        state: orderData.customerDetails?.state || 'Tamil Nadu',
      },
      notes: orderData.notes || '',
      createdAt: serverTimestamp(),
      createdAtIso: orderData.createdAt ? new Date(orderData.createdAt).toISOString() : now,
    };

    await setDoc(orderDocRef, firestoreOrder, { merge: true });
    return firestoreOrder;
  } catch (error) {
    console.error('Error saving order to Firestore:', error);
    return null;
  }
};

/**
 * Get all orders placed by this customer UID
 */
export const getUserOrders = async (uid) => {
  if (!uid) return [];
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    const orders = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Client-side sort by date descending
    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAtIso || 0).getTime();
      const dateB = new Date(b.createdAtIso || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching customer orders from Firestore:', error);
    return [];
  }
};

/**
 * Get single order details from Firestore
 */
export const getFirestoreOrder = async (orderId) => {
  if (!orderId) return null;
  try {
    const orderRef = doc(db, 'orders', orderId.toUpperCase());
    const snap = await getDoc(orderRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching single order from Firestore:', error);
    return null;
  }
};

// ==========================================
// 4. WISHLIST FOUNDATION (Firestore 'wishlist')
// ==========================================

export const getUserWishlist = async (uid) => {
  if (!uid) return [];
  try {
    const wishlistRef = collection(db, 'wishlist');
    const q = query(wishlistRef, where('uid', '==', uid));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
};

export const addToWishlist = async (uid, productId) => {
  if (!uid || !productId) return null;
  try {
    const docId = `${uid}_${productId}`;
    const docRef = doc(db, 'wishlist', docId);
    const data = {
      uid,
      productId,
      addedAt: serverTimestamp(),
      addedAtIso: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

export const removeFromWishlist = async (uid, productId) => {
  if (!uid || !productId) return false;
  try {
    const docId = `${uid}_${productId}`;
    const docRef = doc(db, 'wishlist', docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};
