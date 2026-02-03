#!/usr/bin/env python3
"""
Islamic Content Curation System
Manages content selection, organization, and anti-repetition for the Islamic Guidance App
"""

import argparse
import json
import sqlite3
import random
from datetime import datetime, timedelta
from pathlib import Path

class IslamicContentCurator:
    def __init__(self, db_path="islamic_content.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self._init_database()
    
    def _init_database(self):
        """Initialize database with proper schema"""
        cursor = self.conn.cursor()
        
        # Content table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK (type IN ('quran', 'hadith', 'term', 'commentary')),
                arabic_text TEXT,
                english_translation TEXT,
                source TEXT NOT NULL,
                scholar TEXT,
                context TEXT,
                difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
                emotional_tags TEXT, -- JSON array
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified_at TIMESTAMP,
                verified_by TEXT,
                usage_count INTEGER DEFAULT 0,
                last_used TIMESTAMP
            )
        ''')
        
        # Islamic terms table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS islamic_terms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                arabic_term TEXT UNIQUE NOT NULL,
                transliteration TEXT,
                english_meaning TEXT,
                usage_context TEXT,
                emotional_association TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # User history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                content_id INTEGER,
                mood TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                feedback INTEGER, -- 1-5 rating
                FOREIGN KEY (content_id) REFERENCES content (id)
            )
        ''')
        
        # Content moods mapping table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_moods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER,
                mood TEXT NOT NULL,
                relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
                FOREIGN KEY (content_id) REFERENCES content (id)
            )
        ''')
        
        self.conn.commit()
    
    def add_quranic_verse(self, surah, ayah, arabic_text, translation, scholar=None, context=None, difficulty=2, moods=None):
        """Add a Quranic verse to the database"""
        cursor = self.conn.cursor()
        
        source = f"Quran {surah}:{ayah}"
        emotional_tags = json.dumps(moods or [])
        
        cursor.execute('''
            INSERT INTO content (type, arabic_text, english_translation, source, scholar, context, difficulty_level, emotional_tags, verified_at, verified_by)
            VALUES ('quran', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'System')
        ''', (arabic_text, translation, source, scholar, context, difficulty, emotional_tags))
        
        content_id = cursor.lastrowid
        
        # Add mood mappings
        if moods:
            for mood in moods:
                relevance_score = self._calculate_mood_relevance('quran', mood, context)
                cursor.execute('''
                    INSERT INTO content_moods (content_id, mood, relevance_score)
                    VALUES (?, ?, ?)
                ''', (content_id, mood, relevance_score))
        
        self.conn.commit()
        return content_id
    
    def add_hadith(self, collection, narrator, arabic_text, translation, scholar=None, context=None, difficulty=3, moods=None):
        """Add a Hadith to the database"""
        cursor = self.conn.cursor()
        
        source = f"{collection} - {narrator}"
        emotional_tags = json.dumps(moods or [])
        
        cursor.execute('''
            INSERT INTO content (type, arabic_text, english_translation, source, scholar, context, difficulty_level, emotional_tags, verified_at, verified_by)
            VALUES ('hadith', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'System')
        ''', (arabic_text, translation, source, scholar, context, difficulty, emotional_tags))
        
        content_id = cursor.lastrowid
        
        # Add mood mappings
        if moods:
            for mood in moods:
                relevance_score = self._calculate_mood_relevance('hadith', mood, context)
                cursor.execute('''
                    INSERT INTO content_moods (content_id, mood, relevance_score)
                    VALUES (?, ?, ?)
                ''', (content_id, mood, relevance_score))
        
        self.conn.commit()
        return content_id
    
    def add_islamic_term(self, arabic_term, transliteration, meaning, context=None, emotional_association=None):
        """Add an Islamic term to the database"""
        cursor = self.conn.cursor()
        
        cursor.execute('''
            INSERT INTO islamic_terms (arabic_term, transliteration, english_meaning, usage_context, emotional_association)
            VALUES (?, ?, ?, ?, ?)
        ''', (arabic_term, transliteration, meaning, context, emotional_association))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def select_content_for_mood(self, mood, user_id=None, exclude_recent=True):
        """Select appropriate content for a specific emotional state"""
        cursor = self.conn.cursor()
        
        # Base query for mood-appropriate content
        query = '''
            SELECT c.*, cm.relevance_score
            FROM content c
            JOIN content_moods cm ON c.id = cm.content_id
            WHERE cm.mood = ?
        '''
        params = [mood]
        
        # Exclude recently shown content for this user
        if exclude_recent and user_id:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            query += '''
                AND c.id NOT IN (
                    SELECT content_id FROM user_history 
                    WHERE user_id = ? AND timestamp > ?
                )
            '''
            params.extend([user_id, thirty_days_ago])
        
        # Order by relevance score and usage diversity
        query += '''
            ORDER BY cm.relevance_score DESC, c.usage_count ASC, RANDOM()
            LIMIT 10
        '''
        
        cursor.execute(query, params)
        candidates = cursor.fetchall()
        
        if not candidates:
            return None
        
        # Select from candidates with weighted random choice
        weights = [row[-1] for row in candidates]  # relevance scores
        selected = random.choices(candidates, weights=weights)[0]
        
        # Update usage statistics
        self._update_content_usage(selected[0])
        self._record_user_history(user_id, selected[0], mood)
        
        return {
            'id': selected[0],
            'type': selected[1],
            'arabic_text': selected[2],
            'english_translation': selected[3],
            'source': selected[4],
            'scholar': selected[5],
            'context': selected[6],
            'difficulty_level': selected[7],
            'emotional_tags': json.loads(selected[8]) if selected[8] else []
        }
    
    def get_content_variety(self, user_id, days=7):
        """Ensure content variety for a user over specified period"""
        cursor = self.conn.cursor()
        
        since_date = datetime.now() - timedelta(days=days)
        
        cursor.execute('''
            SELECT c.type, COUNT(*) as count
            FROM content c
            JOIN user_history uh ON c.id = uh.content_id
            WHERE uh.user_id = ? AND uh.timestamp > ?
            GROUP BY c.type
        ''', [user_id, since_date])
        
        type_distribution = dict(cursor.fetchall())
        
        # Check if we need more variety
        total_content = sum(type_distribution.values())
        variety_score = len(type_distribution) / 4.0  # 4 content types available
        
        return {
            'distribution': type_distribution,
            'total_shown': total_content,
            'variety_score': variety_score,
            'needs_more_variety': variety_score < 0.5
        }
    
    def get_personalized_recommendations(self, user_id, limit=5):
        """Get personalized content recommendations based on user history"""
        cursor = self.conn.cursor()
        
        # Get user's preferred moods and content types
        cursor.execute('''
            SELECT mood, COUNT(*) as frequency
            FROM user_history
            WHERE user_id = ?
            GROUP BY mood
            ORDER BY frequency DESC
            LIMIT 3
        ''', [user_id])
        
        preferred_moods = [row[0] for row in cursor.fetchall()]
        
        recommendations = []
        
        for mood in preferred_moods:
            content = self.select_content_for_mood(mood, user_id, exclude_recent=False)
            if content and content not in recommendations:
                recommendations.append(content)
                if len(recommendations) >= limit:
                    break
        
        return recommendations
    
    def _calculate_mood_relevance(self, content_type, mood, context):
        """Calculate relevance score for content-mood mapping"""
        base_scores = {
            'quran': 5,  # Highest authority
            'hadith': 4,  # Prophetic guidance
            'term': 3,    # Educational
            'commentary': 2  # Supporting content
        }
        
        mood_modifiers = {
            'anxious': {'quran': +1, 'hadith': +1},  # Divine and prophetic comfort
            'guilty': {'quran': +2, 'hadith': +2},  # Forgiveness themes
            'grateful': {'quran': +1, 'hadith': 0},  # Blessings emphasis
            'angry': {'hadith': +1, 'quran': 0},    # Prophetic patience
            'sad': {'quran': +1, 'hadith': +1},     # Divine comfort
            'hopeful': {'quran': +2, 'hadith': +1}   # Paradise and success
        }
        
        base_score = base_scores.get(content_type, 3)
        modifier = mood_modifiers.get(mood, {}).get(content_type, 0)
        
        return min(5, max(1, base_score + modifier))
    
    def _update_content_usage(self, content_id):
        """Update content usage statistics"""
        cursor = self.conn.cursor()
        cursor.execute('''
            UPDATE content 
            SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', [content_id])
        self.conn.commit()
    
    def _record_user_history(self, user_id, content_id, mood):
        """Record content shown to user"""
        if user_id:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO user_history (user_id, content_id, mood)
                VALUES (?, ?, ?)
            ''', [user_id, content_id, mood])
            self.conn.commit()
    
    def export_content_database(self, output_file):
        """Export content database for backup or analysis"""
        cursor = self.conn.cursor()
        
        cursor.execute('SELECT * FROM content')
        content_data = cursor.fetchall()
        
        cursor.execute('SELECT * FROM content_moods')
        mood_data = cursor.fetchall()
        
        cursor.execute('SELECT * FROM islamic_terms')
        terms_data = cursor.fetchall()
        
        export_data = {
            'content': [dict(zip([col[0] for col in cursor.description], row)) for row in content_data],
            'mood_mappings': [dict(zip([col[0] for col in cursor.description], row)) for row in mood_data],
            'islamic_terms': [dict(zip([col[0] for col in cursor.description], row)) for row in terms_data],
            'export_timestamp': datetime.now().isoformat()
        }
        
        with open(output_file, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        print(f"📄 Content database exported to {output_file}")
    
    def import_content_database(self, input_file):
        """Import content from backup file"""
        with open(input_file, 'r') as f:
            import_data = json.load(f)
        
        cursor = self.conn.cursor()
        
        # Import content
        for item in import_data.get('content', []):
            cursor.execute('''
                INSERT OR REPLACE INTO content 
                (id, type, arabic_text, english_translation, source, scholar, context, difficulty_level, emotional_tags, created_at, verified_at, verified_by, usage_count, last_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', [
                item['id'], item['type'], item['arabic_text'], item['english_translation'],
                item['source'], item['scholar'], item['context'], item['difficulty_level'],
                item['emotional_tags'], item['created_at'], item['verified_at'],
                item['verified_by'], item['usage_count'], item['last_used']
            ])
        
        # Import mood mappings
        for item in import_data.get('mood_mappings', []):
            cursor.execute('''
                INSERT OR REPLACE INTO content_moods (id, content_id, mood, relevance_score)
                VALUES (?, ?, ?, ?)
            ''', [item['id'], item['content_id'], item['mood'], item['relevance_score']])
        
        # Import Islamic terms
        for item in import_data.get('islamic_terms', []):
            cursor.execute('''
                INSERT OR REPLACE INTO islamic_terms 
                (id, arabic_term, transliteration, english_meaning, usage_context, emotional_association, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', [
                item['id'], item['arabic_term'], item['transliteration'], item['english_meaning'],
                item['usage_context'], item['emotional_association'], item['created_at']
            ])
        
        self.conn.commit()
        print(f"📄 Content database imported from {input_file}")

def main():
    parser = argparse.ArgumentParser(description="Islamic content curation system")
    parser.add_argument("--action", choices=["add-quran", "add-hadith", "add-term", "select", "variety", "recommendations", "export", "import"], required=True)
    parser.add_argument("--db", default="islamic_content.db", help="Database file path")
    parser.add_argument("--surah", type=int, help="Quran Surah number")
    parser.add_argument("--ayah", type=int, help="Quran Ayah number")
    parser.add_argument("--arabic", help="Arabic text")
    parser.add_argument("--translation", help="English translation")
    parser.add_argument("--collection", help="Hadith collection")
    parser.add_argument("--narrator", help="Hadith narrator")
    parser.add_argument("--scholar", help="Scholar name")
    parser.add_argument("--context", help="Context information")
    parser.add_argument("--difficulty", type=int, default=2, help="Difficulty level (1-5)")
    parser.add_argument("--moods", help="Comma-separated list of suitable moods")
    parser.add_argument("--term", help="Islamic term")
    parser.add_argument("--transliteration", help="Term transliteration")
    parser.add_argument("--meaning", help="Term meaning")
    parser.add_argument("--mood", help="Target mood for selection")
    parser.add_argument("--user-id", help="User identifier")
    parser.add_argument("--file", help="File for export/import")
    parser.add_argument("--limit", type=int, default=5, help="Limit for recommendations")
    
    args = parser.parse_args()
    
    curator = IslamicContentCurator(args.db)
    moods = args.moods.split(',') if args.moods else []
    
    if args.action == "add-quran":
        if not all([args.surah, args.ayah, args.arabic, args.translation]):
            print("❌ Adding Quran requires --surah, --ayah, --arabic, and --translation")
            return
        
        content_id = curator.add_quranic_verse(
            args.surah, args.ayah, args.arabic, args.translation,
            args.scholar, args.context, args.difficulty, moods
        )
        print(f"✅ Added Quranic verse with ID: {content_id}")
    
    elif args.action == "add-hadith":
        if not all([args.collection, args.narrator, args.arabic, args.translation]):
            print("❌ Adding Hadith requires --collection, --narrator, --arabic, and --translation")
            return
        
        content_id = curator.add_hadith(
            args.collection, args.narrator, args.arabic, args.translation,
            args.scholar, args.context, args.difficulty, moods
        )
        print(f"✅ Added Hadith with ID: {content_id}")
    
    elif args.action == "add-term":
        if not all([args.term, args.transliteration, args.meaning]):
            print("❌ Adding term requires --term, --transliteration, and --meaning")
            return
        
        term_id = curator.add_islamic_term(args.term, args.transliteration, args.meaning, args.context)
        print(f"✅ Added Islamic term with ID: {term_id}")
    
    elif args.action == "select":
        if not args.mood:
            print("❌ Content selection requires --mood")
            return
        
        content = curator.select_content_for_mood(args.mood, args.user_id)
        if content:
            print(json.dumps(content, indent=2))
        else:
            print("❌ No suitable content found")
    
    elif args.action == "variety":
        if not args.user_id:
            print("❌ Variety check requires --user-id")
            return
        
        variety = curator.get_content_variety(args.user_id)
        print(json.dumps(variety, indent=2))
    
    elif args.action == "recommendations":
        if not args.user_id:
            print("❌ Recommendations require --user-id")
            return
        
        recommendations = curator.get_personalized_recommendations(args.user_id, args.limit)
        print(json.dumps(recommendations, indent=2))
    
    elif args.action == "export":
        if not args.file:
            print("❌ Export requires --file")
            return
        
        curator.export_content_database(args.file)
    
    elif args.action == "import":
        if not args.file:
            print("❌ Import requires --file")
            return
        
        curator.import_content_database(args.file)

if __name__ == "__main__":
    main()
