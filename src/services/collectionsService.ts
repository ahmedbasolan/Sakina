import { getDatabase, dbQuery } from '../database/schema';
import { Collection, SavedReflection } from '../types';

export class CollectionsService {
  private static instance: CollectionsService;

  static getInstance(): CollectionsService {
    if (!CollectionsService.instance) {
      CollectionsService.instance = new CollectionsService();
    }
    return CollectionsService.instance;
  }

  async createCollection(name: string, description?: string): Promise<Collection> {
    try {
      const collectionId = `collection_${Date.now()}`;
      const now = Date.now();

      const collection: Collection = {
        id: collectionId,
        name,
        description,
        itemCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await dbQuery(async (db) => {
        await db.runAsync(
          `
          INSERT INTO collections (id, name, description, itemCount, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [collectionId, name, description || null, 0, now, now],
        );
      });

      return collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async getCollections(): Promise<Collection[]> {
    try {
      return await dbQuery(async (db) => {
        const result = await db.getAllAsync(`
          SELECT * FROM collections ORDER BY updatedAt DESC
        `);

        return result as Collection[];
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  async getCollectionById(collectionId: string): Promise<Collection | null> {
    try {
      return await dbQuery(async (db) => {
        const result = await db.getFirstAsync(
          `
          SELECT * FROM collections WHERE id = ? LIMIT 1
        `,
          [collectionId],
        );

        return result as Collection | null;
      });
    } catch (error) {
      console.error('Error fetching collection:', error);
      return null;
    }
  }

  async updateCollection(
    collectionId: string,
    name: string,
    description?: string,
  ): Promise<boolean> {
    try {
      await dbQuery(async (db) => {
        await db.runAsync(
          `
          UPDATE collections 
          SET name = ?, description = ?, updatedAt = ?
          WHERE id = ?
        `,
          [name, description || null, Date.now(), collectionId],
        );
      });

      return true;
    } catch (error) {
      console.error('Error updating collection:', error);
      return false;
    }
  }

  async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      await dbQuery(async (db) => {
        // Remove collection from all saved items in this collection
        await db.runAsync(
          `
          UPDATE saved_reflections 
          SET collectionId = NULL 
          WHERE collectionId = ?
        `,
          [collectionId],
        );

        // Delete the collection
        await db.runAsync(
          `
          DELETE FROM collections WHERE id = ?
        `,
          [collectionId],
        );
      });

      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }

  async addToCollection(savedReflectionId: string, collectionId: string): Promise<boolean> {
    try {
      await dbQuery(async (db) => {
        // Add to collection
        await db.runAsync(
          `
          UPDATE saved_reflections 
          SET collectionId = ? 
          WHERE id = ?
        `,
          [collectionId, savedReflectionId],
        );
      });

      // Update collection item count
      await this.updateCollectionItemCount(collectionId);

      return true;
    } catch (error) {
      console.error('Error adding to collection:', error);
      return false;
    }
  }

  async removeFromCollection(savedReflectionId: string): Promise<boolean> {
    try {
      const savedItem = await dbQuery(async (db) => {
        // Get collection ID before removing
        const item = await db.getFirstAsync(
          `
          SELECT collectionId FROM saved_reflections WHERE id = ? LIMIT 1
        `,
          [savedReflectionId],
        );

        // Remove from collection
        await db.runAsync(
          `
          UPDATE saved_reflections 
          SET collectionId = NULL 
          WHERE id = ?
        `,
          [savedReflectionId],
        );

        return item;
      });

      // Update collection item count if it was in a collection
      if (savedItem && (savedItem as any).collectionId) {
        await this.updateCollectionItemCount((savedItem as any).collectionId);
      }

      return true;
    } catch (error) {
      console.error('Error removing from collection:', error);
      return false;
    }
  }

  async getItemsInCollection(collectionId: string): Promise<SavedReflection[]> {
    try {
      return await dbQuery(async (db) => {
        const result = await db.getAllAsync(
          `
          SELECT sr.* FROM saved_reflections sr
          WHERE sr.collectionId = ?
          ORDER BY sr.timestamp DESC
        `,
          [collectionId],
        );

        return result as SavedReflection[];
      });
    } catch (error) {
      console.error('Error fetching collection items:', error);
      return [];
    }
  }

  async getFavoriteItems(): Promise<SavedReflection[]> {
    try {
      return await dbQuery(async (db) => {
        const result = await db.getAllAsync(`
          SELECT * FROM saved_reflections 
          WHERE isFavorite = 1 
          ORDER BY timestamp DESC
        `);

        return result as SavedReflection[];
      });
    } catch (error) {
      console.error('Error fetching favorite items:', error);
      return [];
    }
  }

  async toggleFavorite(savedReflectionId: string): Promise<boolean> {
    try {
      await dbQuery(async (db) => {
        // Get current favorite status
        const current = await db.getFirstAsync(
          `
          SELECT isFavorite FROM saved_reflections WHERE id = ? LIMIT 1
        `,
          [savedReflectionId],
        );

        if (current) {
          const newFavoriteStatus = !(current as any).isFavorite;

          await db.runAsync(
            `
            UPDATE saved_reflections 
            SET isFavorite = ? 
            WHERE id = ?
          `,
            [newFavoriteStatus ? 1 : 0, savedReflectionId],
          );
        }
      });

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  private async updateCollectionItemCount(collectionId: string): Promise<void> {
    try {
      await dbQuery(async (db) => {
        // Count items in collection
        const countResult = await db.getFirstAsync(
          `
          SELECT COUNT(*) as count FROM saved_reflections 
          WHERE collectionId = ?
        `,
          [collectionId],
        );

        const itemCount = (countResult as any)?.count || 0;

        // Update collection
        await db.runAsync(
          `
          UPDATE collections 
          SET itemCount = ?, updatedAt = ?
          WHERE id = ?
        `,
          [itemCount, Date.now(), collectionId],
        );
      });
    } catch (error) {
      console.error('Error updating collection item count:', error);
    }
  }

  // Get uncategorized saved items (not in any collection)
  async getUncategorizedItems(): Promise<SavedReflection[]> {
    try {
      return await dbQuery(async (db) => {
        const result = await db.getAllAsync(`
          SELECT * FROM saved_reflections 
          WHERE collectionId IS NULL 
          ORDER BY timestamp DESC
        `);

        return result as SavedReflection[];
      });
    } catch (error) {
      console.error('Error fetching uncategorized items:', error);
      return [];
    }
  }
}
