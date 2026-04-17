import mongoose from 'mongoose';

// Collection schema (embedded in user favorites)
const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameAr: String,
    description: String,
    descriptionAr: String,
    color: { type: String, default: '#D4AF37' },
    icon: { type: String, default: 'folder' },
    isDefault: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    shareLink: String,
  },
  { timestamps: true }
);

// Favorite item schema
const favoriteItemSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  notes: String,
  addedAt: { type: Date, default: Date.now },
});

// User favorites schema
const userFavoritesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collections: {
      type: [collectionSchema],
      default: [
        {
          name: 'All Favorites',
          nameAr: 'كل المفضلة',
          color: '#D4AF37',
          icon: 'heart',
          isDefault: true,
        },
      ],
    },
    favorites: {
      type: [favoriteItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for fast lookups
userFavoritesSchema.index({ user: 1 });
userFavoritesSchema.index({ 'favorites.property': 1 });

export default mongoose.model('UserFavorites', userFavoritesSchema);
