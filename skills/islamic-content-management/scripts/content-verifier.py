#!/usr/bin/env python3
"""
Islamic Content Verification System
Verifies and validates Islamic content for accuracy and appropriateness
"""

import argparse
import json
import re
from pathlib import Path

class IslamicContentVerifier:
    def __init__(self):
        self.quran_chapters = self._load_quran_chapters()
        self.authentic_hadith_collections = [
            "Sahih Bukhari", "Sahih Muslim", "Sunan Abu Dawud",
            "Jami at-Tirmidhi", "Sunan an-Nasa'i", "Sunan Ibn Majah"
        ]
        self.islamic_terms = self._load_islamic_terms()
    
    def _load_quran_chapters(self):
        """Load Quran chapter information"""
        return {
            1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Aal-E-Imran", 4: "An-Nisa",
            5: "Al-Ma'idah", 6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal",
            9: "At-Tawbah", 10: "Yunus", 11: "Hud", 12: "Yusuf",
            13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr", 16: "An-Nahl",
            17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
            # Add more chapters as needed
        }
    
    def _load_islamic_terms(self):
        """Load common Islamic terms for validation"""
        return {
            "tawbah": "repentance",
            "sabr": "patience", 
            "shukr": "gratitude",
            "tawakkul": "trust in Allah",
            "iman": "faith",
            "islam": "submission",
            "ihsan": "excellence",
            "taqwa": "God-consciousness",
            "rida": "contentment",
            "hilm": "forbearance"
        }
    
    def verify_quranic_verse(self, surah, ayah, arabic_text, translation):
        """Verify Quranic verse accuracy"""
        issues = []
        
        # Check chapter validity
        if surah not in self.quran_chapters:
            issues.append(f"Invalid Surah number: {surah}")
        
        # Check ayah validity (basic range check)
        if ayah < 1 or ayah > 286:  # Max verses in any Surah
            issues.append(f"Invalid Ayah number: {ayah}")
        
        # Check Arabic text for basic Quranic Arabic patterns
        if not self._has_quranic_patterns(arabic_text):
            issues.append("Arabic text doesn't appear to be Quranic Arabic")
        
        # Check translation quality
        if not self._check_translation_quality(translation):
            issues.append("Translation may need review for quality")
        
        # Check length appropriateness
        if len(arabic_text) < 10:
            issues.append("Arabic text seems too short for a verse")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "confidence": self._calculate_confidence(issues)
        }
    
    def verify_hadith(self, collection, narrator, arabic_text, translation):
        """Verify Hadith authenticity and format"""
        issues = []
        
        # Check collection authenticity
        if collection not in self.authentic_hadith_collections:
            issues.append(f"Hadith collection '{collection}' not in primary authentic collections")
        
        # Check narrator format
        if not self._validate_narrator_format(narrator):
            issues.append("Narrator format may be incorrect")
        
        # Check Hadith text patterns
        if not self._has_hadith_patterns(arabic_text):
            issues.append("Arabic text doesn't follow typical Hadith patterns")
        
        # Check translation completeness
        if len(translation) < len(arabic_text) * 0.3:
            issues.append("Translation seems incomplete compared to Arabic text")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "confidence": self._calculate_confidence(issues)
        }
    
    def verify_islamic_term(self, arabic_term, transliteration, meaning):
        """Verify Islamic term accuracy"""
        issues = []
        
        # Check if term exists in database
        term_lower = arabic_term.lower()
        if term_lower not in self.islamic_terms:
            issues.append(f"Term '{arabic_term}' not found in common Islamic terms database")
        
        # Check transliteration quality
        if not self._validate_transliteration(transliteration):
            issues.append("Transliteration may not follow standard rules")
        
        # Check meaning appropriateness
        if len(meaning) < 5:
            issues.append("Meaning seems too brief or incomplete")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "confidence": self._calculate_confidence(issues)
        }
    
    def verify_content_appropriateness(self, content, target_mood):
        """Verify content appropriateness for specific emotional state"""
        mood_content_mapping = {
            "anxious": ["tawakkul", "sabr", "trust", "patience"],
            "guilty": ["tawbah", "maghfirah", "forgiveness", "repentance"],
            "grateful": ["shukr", "ni'mah", "gratitude", "blessings"],
            "angry": ["hilm", "'afw", "forbearance", "forgiveness"],
            "sad": ["rida", "ajr", "contentment", "reward"],
            "hopeful": ["raja", "falaah", "hope", "success"]
        }
        
        issues = []
        content_lower = content.lower()
        target_keywords = mood_content_mapping.get(target_mood.lower(), [])
        
        # Check if content contains relevant keywords
        relevant_keywords_found = any(keyword in content_lower for keyword in target_keywords)
        
        if not relevant_keywords_found and target_keywords:
            issues.append(f"Content may not be optimally suited for '{target_mood}' emotional state")
        
        # Check for potentially distressing content
        distressing_patterns = [
            r'\b(punishment|hell|fire|wrath)\b',
            r'\b(doom|destruction|calamity)\b'
        ]
        
        for pattern in distressing_patterns:
            if re.search(pattern, content_lower):
                issues.append(f"Content contains potentially distressing language: {pattern}")
                break
        
        return {
            "appropriate": len(issues) == 0,
            "issues": issues,
            "suggested_moods": self._suggest_moods(content)
        }
    
    def _has_quranic_patterns(self, text):
        """Check if text has Quranic Arabic patterns"""
        quranic_patterns = [
            r'بسم الله',
            r'الله',
            r'رحمن',
            r'رحيم',
            r'إنما',
            r'إن',
            r'ولكن',
            r'فإن'
        ]
        
        return any(re.search(pattern, text) for pattern in quranic_patterns)
    
    def _has_hadith_patterns(self, text):
        """Check if text has Hadith patterns"""
        hadith_patterns = [
            r'قال رسول الله',
            r'صلى الله عليه وسلم',
            r'عن أبي',
            r'عن عائشة',
            r'عن عمر'
        ]
        
        return any(re.search(pattern, text) for pattern in hadith_patterns)
    
    def _validate_narrator_format(self, narrator):
        """Validate Hadith narrator format"""
        # Basic validation - should contain companion name or "عن"
        return len(narrator) > 5 and ('عن' in narrator or 'ابن' in narrator or 'بنت' in narrator)
    
    def _validate_transliteration(self, transliteration):
        """Validate Arabic transliteration quality"""
        # Basic checks for proper transliteration
        if len(transliteration) < 2:
            return False
        
        # Check for common transliteration patterns
        valid_patterns = [
            r'[a-z]+',
            r"[a-z]+'[a-z]+",  # For letters like 'ayn
        ]
        
        return any(re.match(pattern, transliteration, re.IGNORECASE) for pattern in valid_patterns)
    
    def _check_translation_quality(self, translation):
        """Basic translation quality check"""
        if len(translation) < 10:
            return False
        
        # Check for basic English sentence structure
        if not re.search(r'[.!?]$', translation.strip()):
            return False
        
        return True
    
    def _calculate_confidence(self, issues):
        """Calculate confidence score based on issues"""
        if len(issues) == 0:
            return 1.0
        elif len(issues) <= 2:
            return 0.7
        elif len(issues) <= 4:
            return 0.4
        else:
            return 0.1
    
    def _suggest_moods(self, content):
        """Suggest appropriate moods for content"""
        content_lower = content.lower()
        mood_suggestions = []
        
        mood_keywords = {
            "anxious": ["worry", "anxiety", "fear", "trust", "patience"],
            "guilty": ["sin", "mistake", "forgiveness", "repentance"],
            "grateful": ["blessing", "gratitude", "thanks", "favor"],
            "angry": ["anger", "forgiveness", "patience", "calm"],
            "sad": ["sadness", "loss", "reward", "patience"],
            "hopeful": ["hope", "future", "success", "paradise"]
        }
        
        for mood, keywords in mood_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                mood_suggestions.append(mood)
        
        return mood_suggestions if mood_suggestions else ["general"]

def main():
    parser = argparse.ArgumentParser(description="Verify Islamic content accuracy")
    parser.add_argument("--type", choices=["quran", "hadith", "term", "appropriateness"], required=True, help="Content type to verify")
    parser.add_argument("--file", help="JSON file containing content to verify")
    parser.add_argument("--surah", type=int, help="Quran Surah number")
    parser.add_argument("--ayah", type=int, help="Quran Ayah number")
    parser.add_argument("--arabic", help="Arabic text")
    parser.add_argument("--translation", help="English translation")
    parser.add_argument("--collection", help="Hadith collection")
    parser.add_argument("--narrator", help="Hadith narrator")
    parser.add_argument("--term", help="Islamic term")
    parser.add_argument("--transliteration", help="Term transliteration")
    parser.add_argument("--meaning", help="Term meaning")
    parser.add_argument("--mood", help="Target emotional state")
    parser.add_argument("--output", help="Output file for results")
    
    args = parser.parse_args()
    
    verifier = IslamicContentVerifier()
    result = {}
    
    if args.type == "quran":
        if not all([args.surah, args.ayah, args.arabic, args.translation]):
            print("❌ Quran verification requires --surah, --ayah, --arabic, and --translation")
            return
        
        result = verifier.verify_quranic_verse(args.surah, args.ayah, args.arabic, args.translation)
    
    elif args.type == "hadith":
        if not all([args.collection, args.narrator, args.arabic, args.translation]):
            print("❌ Hadith verification requires --collection, --narrator, --arabic, and --translation")
            return
        
        result = verifier.verify_hadith(args.collection, args.narrator, args.arabic, args.translation)
    
    elif args.type == "term":
        if not all([args.term, args.transliteration, args.meaning]):
            print("❌ Term verification requires --term, --transliteration, and --meaning")
            return
        
        result = verifier.verify_islamic_term(args.term, args.transliteration, args.meaning)
    
    elif args.type == "appropriateness":
        if not all([args.arabic or args.translation, args.mood]):
            print("❌ Appropriateness check requires content (--arabic or --translation) and --mood")
            return
        
        content = args.arabic or args.translation
        result = verifier.verify_content_appropriateness(content, args.mood)
    
    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"📄 Results saved to {args.output}")
    else:
        print(json.dumps(result, indent=2))
    
    # Print summary
    if result.get("valid", result.get("appropriate", False)):
        print("✅ Content verification passed")
    else:
        print("❌ Content verification failed")
        for issue in result.get("issues", []):
            print(f"   - {issue}")

if __name__ == "__main__":
    main()
