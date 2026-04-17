import mongoose from 'mongoose';
import UserFavorites from '../models/Favorite.js';
import Property from '../models/Property.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// Favorites Service
// ============================================

/**
 * Get or create user favorites document
 */
async function getOrCreateUserFavorites(userId: string) {
  let userFavorites = await UserFavorites.findOne({ user: userId });

  if (!userFavorites) {
    userFavorites = await UserFavorites.create({
      user: userId,
      collections: [
        {
          name: 'All Favorites',
          nameAr: 'كل المفضلة',
          color: '#D4AF37',
          icon: 'heart',
          isDefault: true,
        },
      ],
      favorites: [],
    });
  }

  return userFavorites;
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(userId: string) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  // Populate property details
  await userFavorites.populate('favorites.property');

  return {
    collections: userFavorites.collections,
    favorites: userFavorites.favorites,
  };
}

/**
 * Add a property to favorites
 */
export async function addToFavorites(
  userId: string,
  propertyId: string,
  collectionId?: string,
  notes?: string
) {
  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw AppError.notFound('Property not found');
  }

  const userFavorites = await getOrCreateUserFavorites(userId);

  // Check if already favorited
  const existingIndex = userFavorites.favorites.findIndex(
    (f: { property: mongoose.Types.ObjectId }) => f.property.toString() === propertyId
  );

  if (existingIndex !== -1) {
    // Update existing favorite
    userFavorites.favorites[existingIndex].collectionId = collectionId
      ? new mongoose.Types.ObjectId(collectionId)
      : undefined;
    userFavorites.favorites[existingIndex].notes = notes;
  } else {
    // Add new favorite
    userFavorites.favorites.push({
      property: new mongoose.Types.ObjectId(propertyId),
      collectionId: collectionId ? new mongoose.Types.ObjectId(collectionId) : undefined,
      notes,
      addedAt: new Date(),
    });
  }

  await userFavorites.save();
  await userFavorites.populate('favorites.property');

  return userFavorites.favorites;
}

/**
 * Remove a property from favorites
 */
export async function removeFromFavorites(userId: string, propertyId: string) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  (userFavorites.favorites as unknown[]) = userFavorites.favorites.filter(
    (f: { property: mongoose.Types.ObjectId }) => f.property.toString() !== propertyId
  );

  await userFavorites.save();

  return { success: true };
}

/**
 * Update notes for a favorite
 */
export async function updateFavoriteNotes(userId: string, propertyId: string, notes: string) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  const favorite = userFavorites.favorites.find(
    (f: { property: mongoose.Types.ObjectId }) => f.property.toString() === propertyId
  );

  if (!favorite) {
    throw AppError.notFound('Favorite not found');
  }

  favorite.notes = notes;
  await userFavorites.save();

  return favorite;
}

/**
 * Create a new collection
 */
export async function createCollection(
  userId: string,
  data: {
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    color?: string;
    icon?: string;
  }
) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  const newCollection = {
    _id: new mongoose.Types.ObjectId(),
    name: data.name,
    nameAr: data.nameAr,
    description: data.description,
    descriptionAr: data.descriptionAr,
    color: data.color || '#D4AF37',
    icon: data.icon || 'folder',
    isDefault: false,
    isShared: false,
  };

  userFavorites.collections.push(newCollection);
  await userFavorites.save();

  return newCollection;
}

/**
 * Update a collection
 */
export async function updateCollection(
  userId: string,
  collectionId: string,
  data: {
    name?: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    color?: string;
    icon?: string;
    isShared?: boolean;
  }
) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  const collection = userFavorites.collections.find(
    (c: { _id: mongoose.Types.ObjectId }) => c._id.toString() === collectionId
  );

  if (!collection) {
    throw AppError.notFound('Collection not found');
  }

  if (collection.isDefault && data.name) {
    throw AppError.badRequest('Cannot rename default collection');
  }

  Object.assign(collection, data);

  // Generate share link if sharing
  if (data.isShared && !collection.shareLink) {
    collection.shareLink = `${userId}-${collectionId}-${Date.now().toString(36)}`;
  }

  await userFavorites.save();

  return collection;
}

/**
 * Delete a collection
 */
export async function deleteCollection(userId: string, collectionId: string) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  const collectionIndex = userFavorites.collections.findIndex(
    (c: { _id: mongoose.Types.ObjectId }) => c._id.toString() === collectionId
  );

  if (collectionIndex === -1) {
    throw AppError.notFound('Collection not found');
  }

  if (userFavorites.collections[collectionIndex].isDefault) {
    throw AppError.badRequest('Cannot delete default collection');
  }

  // Remove collection
  userFavorites.collections.splice(collectionIndex, 1);

  // Remove collection reference from favorites
  userFavorites.favorites.forEach((f: { collectionId?: mongoose.Types.ObjectId | null }) => {
    if (f.collectionId?.toString() === collectionId) {
      f.collectionId = undefined;
    }
  });

  await userFavorites.save();

  return { success: true };
}

/**
 * Move favorite to a collection
 */
export async function moveToCollection(
  userId: string,
  propertyId: string,
  collectionId: string | null
) {
  const userFavorites = await getOrCreateUserFavorites(userId);

  const favorite = userFavorites.favorites.find(
    (f: { property: mongoose.Types.ObjectId }) => f.property.toString() === propertyId
  );

  if (!favorite) {
    throw AppError.notFound('Favorite not found');
  }

  favorite.collectionId = collectionId ? new mongoose.Types.ObjectId(collectionId) : undefined;

  await userFavorites.save();

  return favorite;
}

/**
 * Get shared collection by link
 */
export async function getSharedCollection(shareLink: string) {
  const userFavorites = await UserFavorites.findOne({
    'collections.shareLink': shareLink,
  });

  if (!userFavorites) {
    throw AppError.notFound('Collection not found');
  }

  const collection = userFavorites.collections.find(
    (c: { shareLink?: string | null }) => c.shareLink === shareLink
  );

  if (!collection || !collection.isShared) {
    throw AppError.notFound('Collection not found or not shared');
  }

  // Get favorites in this collection
  const collectionFavorites = userFavorites.favorites.filter(
    (f: { collectionId?: mongoose.Types.ObjectId | null }) =>
      f.collectionId?.toString() === collection._id.toString()
  );

  await userFavorites.populate('favorites.property');

  return {
    collection,
    favorites: collectionFavorites,
  };
}

/**
 * Check if a property is favorited
 */
export async function isFavorited(userId: string, propertyId: string) {
  const userFavorites = await UserFavorites.findOne({ user: userId });

  if (!userFavorites) {
    return false;
  }

  return userFavorites.favorites.some(
    (f: { property: mongoose.Types.ObjectId }) => f.property.toString() === propertyId
  );
}
