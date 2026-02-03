import * as SQLite from 'expo-sqlite';
import { getDatabase, dbQuery } from './schema';
import { initialContent, initialContentAngles } from '../data/initialContent';

export const seedDatabase = async (providedDb?: SQLite.SQLiteDatabase): Promise<void> => {
  const operation = async (db: SQLite.SQLiteDatabase) => {
    // Clear existing content data safely (but NOT user data)
    try {
      await db.execAsync(`
        DELETE FROM content_moods;
        DELETE FROM content_angles;
        DELETE FROM content;
      `);
    } catch (error) {
      console.log('Tables might not exist yet, continuing...');
    }

    // Insert content with better error handling and batching
    console.log('Starting database seeding...');

    for (let i = 0; i < initialContent.length; i++) {
      const content = initialContent[i];
      try {
        await db.runAsync(
          `
          INSERT OR IGNORE INTO content (
            id, type, primaryText, arabicText, transliteration, englishTranslation, 
            source, audioKey, whyThis, propheticPractice, optionalAction, optionalReflection
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            content.id,
            content.type,
            content.primaryText,
            content.arabicText || null,
            content.transliteration || null,
            content.englishTranslation || null,
            content.source,
            content.audioKey || null,
            content.whyThis,
            JSON.stringify(content.propheticPractice) || null,
            content.optionalAction || null,
            content.optionalReflection || null,
          ],
        );

        // Insert mood relationships
        if (content.moods) {
          for (const mood of content.moods) {
            try {
              const relevanceScore = (content.moodScores && content.moodScores[mood]) || 10;
              await db.runAsync(
                `
                INSERT OR IGNORE INTO content_moods (contentId, mood, relevanceScore) VALUES (?, ?, ?)
              `,
                [content.id, mood, relevanceScore],
              );
            } catch (error) {
              console.error('Error inserting mood relationship:', content.id, mood, error);
            }
          }
        }

        // Log progress every 5 items
        if (i % 5 === 0) {
          console.log(`Seeded ${i + 1}/${initialContent.length} content items`);
        }
      } catch (error) {
        console.error(`Error inserting content ${content.id}:`, error);
        // Continue with next item instead of failing completely
      }
    }

    console.log('Database seeding completed successfully');

    // Insert content angles
    for (const angle of initialContentAngles) {
      try {
        await db.runAsync(
          `
          INSERT OR IGNORE INTO content_angles (id, contentId, mood, angle, action, actionArabicText, actionTransliteration, actionSource, actionHowTo, actionReward, reflection)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            angle.id,
            angle.contentId,
            angle.mood || 'General',
            angle.angle,
            angle.action || null,
            angle.actionArabicText || null,
            angle.actionTransliteration || null,
            angle.actionSource || null,
            angle.actionHowTo || null,
            angle.actionReward || null,
            angle.reflection || null,
          ],
        );
      } catch (error) {
        console.error('Error inserting angle:', angle.id, error);
      }
    }

    console.log('Database seeded successfully');
  };

  if (providedDb) {
    await operation(providedDb);
  } else {
    await dbQuery(operation);
  }
};
