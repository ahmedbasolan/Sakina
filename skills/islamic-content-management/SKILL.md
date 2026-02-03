---
name: islamic-content-management
description: Manages Islamic content curation, verification, and organization for the Islamic Guidance App. Handles Quranic verses, Hadith, Islamic terms, and scholarly content with proper attribution, context, and cultural sensitivity. Ensures content accuracy, spiritual appropriateness, and educational value.
license: Complete terms in LICENSE.txt
---

# Islamic Content Management

## Overview

This skill provides comprehensive guidelines for managing Islamic content in the Islamic Guidance App, ensuring accuracy, cultural sensitivity, and spiritual appropriateness for all religious materials.

**Keywords**: Islamic content, Quranic verses, Hadith, Islamic terms, content curation, scholarly verification, religious accuracy, spiritual guidance, Islamic knowledge

## Content Categories

### Primary Content Types

#### Quranic Verses (Ayat)

- **Format**: Arabic text + English translation + source reference
- **Requirements**: Accurate translation, proper Surah/Ayah citation
- **Context**: Provide relevant spiritual context
- **Restrictions**: No partial verses out of context

#### Hadith Collections

- **Format**: Arabic text + English translation + source attribution
- **Sources**: Sahih Bukhari, Sahih Muslim, Abu Dawud, etc.
- **Requirements**: Authentic chains of narration, proper classification
- **Context**: Historical and practical relevance

#### Islamic Terms & Concepts

- **Format**: Arabic term + transliteration + meaning + usage
- **Examples**: Tawbah, Sabr, Shukr, Iman, etc.
- **Requirements**: Accurate spelling, proper context
- **Usage**: Mood associations, spiritual concepts

#### Scholarly Commentary

- **Format**: Scholar name + explanation + source
- **Requirements**: Qualified Islamic scholars, proper attribution
- **Topics**: Tafsir, Fiqh, Islamic psychology
- **Restrictions**: No personal opinions without scholarly basis

## Content Verification Process

### Primary Verification Checklist

- [ ] **Source Authenticity**: Verified from primary Islamic sources
- [ ] **Translation Accuracy**: English translation checked by qualified translators
- [ ] **Context Appropriateness**: Suitable for the intended emotional/spiritual state
- [ ] **Cultural Sensitivity**: Respects diverse Islamic traditions
- [ ] **Educational Value**: Provides meaningful spiritual guidance
- [ ] **Attribution**: Proper source citation and scholarly credit

### Secondary Review Process

- [ ] **Scholarly Review**: Reviewed by qualified Islamic scholar
- [ ] **Peer Review**: Validated by multiple content reviewers
- [ ] **Community Feedback**: Tested with diverse Muslim community
- [ ] **Technical Accuracy**: Proper formatting, no broken references
- [ ] **Accessibility**: Clear language, appropriate complexity

## Content Standards

### Quality Metrics

- **Accuracy**: 100% source verification required
- **Clarity**: Language accessible to general Muslim audience
- **Relevance**: Directly applicable to user's emotional/spiritual state
- **Completeness**: Full context provided, no misleading partial content
- **Respect**: Honors the sacred nature of religious content

### Content Hierarchy

1. **Quranic Verses** (Highest priority, most authoritative)
2. **Prophetic Hadith** (Secondary authority, practical guidance)
3. **Islamic Terms** (Educational, definitional)
4. **Scholarly Commentary** (Supporting context, explanation)
5. **Practical Actions** (Application, implementation)

## Mood-Content Mapping

### Emotional States to Islamic Concepts

- **Anxious/Worried** → Tawakkul (Trust in Allah), Sabr (Patience)
- **Guilty/Repentant** → Tawbah (Repentance), Maghfirah (Forgiveness)
- **Grateful/Thankful** → Shukr (Gratitude), Ni'mah (Blessings)
- **Angry/Frustrated** → Hilm (Forbearance), 'Afw (Forgiveness)
- **Sad/Grieving** → Rida (Contentment), Ajr (Reward)
- **Hopeful/Optimistic** → Raja (Hope), Falaah (Success)

### Content Selection Criteria

- **Relevance**: Directly addresses the emotional state
- **Spiritual Benefit**: Provides genuine comfort/guidance
- **Practical Application**: Actionable advice or perspective
- **Islamic Authenticity**: Based on sound Islamic principles
- **Psychological Appropriateness**: Mentally and emotionally beneficial

## Content Organization

### Database Schema

```sql
-- Content table structure
CREATE TABLE content (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL, -- 'quran', 'hadith', 'term', 'commentary'
  arabic_text TEXT,
  english_translation TEXT,
  source TEXT NOT NULL, -- Surah:Ayah, Hadith collection, etc.
  scholar TEXT, -- Attributed scholar or translator
  context TEXT, -- Historical/spiritual context
  difficulty_level INTEGER, -- 1-5 complexity scale
  emotional_tags TEXT, -- JSON array of suitable moods
  created_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by TEXT
);

-- Islamic terms table
CREATE TABLE islamic_terms (
  id INTEGER PRIMARY KEY,
  arabic_term TEXT UNIQUE NOT NULL,
  transliteration TEXT,
  english_meaning TEXT,
  usage_context TEXT,
  related_verses TEXT, -- JSON array of content IDs
  emotional_association TEXT
);
```

### Content Relationships

- **Verse → Terms**: Islamic terms mentioned in verses
- **Term → Verses**: Verses that explain the term
- **Content → Moods**: Which emotional states each content addresses
- **Scholar → Content**: Which scholar verified/translated each content

## Content Curation Guidelines

### Sourcing Standards

- **Quran**: Standard Arabic text, verified translations
- **Hadith**: Authentic collections (Sihah Sittah优先)
- **Scholarly Works**: Recognized Islamic scholars, contemporary and classical
- **Translations**: Qualified translators, cross-verified

### Translation Guidelines

- **Accuracy**: Preserve original meaning without distortion
- **Clarity**: Accessible to modern English-speaking Muslims
- **Respect**: Maintain sacred nature of the text
- **Context**: Provide necessary cultural/historical context
- **Neutrality**: Avoid sectarian bias or interpretation

### Contextualization Rules

- **Historical Context**: When revelation occurred, circumstances
- **Spiritual Context**: Deeper meaning and significance
- **Practical Context**: How to apply in daily life
- **Modern Relevance**: Contemporary application and understanding

## Anti-Repetition System

### Content Rotation Logic

- **User History**: Track previously shown content
- **Time Decay**: Content becomes available again after 30 days
- **Variety Assurance**: Ensure different content types and sources
- **Progressive Disclosure**: Start with simpler content, advance to complex

### Smart Selection Algorithm

```python
def select_content(user_mood, user_history, content_db):
    # Filter by mood appropriateness
    suitable_content = content_db.filter_by_mood(user_mood)

    # Exclude recently shown content
    available_content = suitable_content.exclude_recent(user_history)

    # Prioritize by:
    # 1. Content type variety
    # 2. Source diversity
    # 3. Difficulty progression
    # 4. User preferences

    return ranked_selection(available_content)
```

## Cultural Sensitivity

### Diversity Considerations

- **Madhhab Respect**: Content suitable for all Islamic schools of thought
- **Cultural Variations**: Acknowledge different cultural practices
- **Language Accessibility**: Clear for non-Arabic speakers
- **Educational Levels**: Appropriate for various knowledge levels

### Avoidance Guidelines

- **Controversial Topics**: Avoid sectarian debates
- **Political Content**: No political commentary or bias
- **Cultural Insensitivity**: Respect diverse Muslim cultures
- **Extremism**: No radical or fringe interpretations

## Quality Assurance

### Automated Checks

- **Source Verification**: Automated source validation
- **Translation Consistency**: Cross-reference with standard translations
- **Format Compliance**: Ensure consistent formatting
- **Duplicate Detection**: Identify and prevent content duplication

### Manual Review Process

- **Scholarly Review**: Qualified Islamic scholar approval
- **Editorial Review**: Content quality and clarity
- **Technical Review**: Formatting and functionality
- **Community Testing**: User feedback and testing

## Emergency Content Protocol

### Sensitive Content Handling

- **Crisis Situations**: Content for emergencies, distress
- **Mental Health**: Professional resources alongside spiritual guidance
- **Imminent Harm**: Immediate professional help resources
- **Safety Protocols**: Clear escalation paths for serious issues

### Content Warnings

- **Distressing Topics**: Content warnings for difficult subjects
- **Age Appropriateness**: Content suitable for intended audience
- **Trigger Warnings**: Potentially triggering content identification

## Usage Analytics

### Content Performance Metrics

- **User Engagement**: Which content resonates with users
- **Emotional Impact**: Effectiveness for different emotional states
- **Retention Rate**: How well content helps users
- **Feedback Quality**: User satisfaction and improvement suggestions

### Continuous Improvement

- **Content Updates**: Regular addition of new verified content
- **Translation Improvements**: Ongoing translation refinement
- **Context Enhancement**: Adding relevant context and explanations
- **User Feedback Integration**: Incorporating community input

## Legal and Ethical Considerations

### Copyright Compliance

- **Public Domain**: Use public domain translations where possible
- **Permission**: Obtain permissions for copyrighted material
- **Attribution**: Proper attribution for all sources
- **Fair Use**: Educational and religious use considerations

### Ethical Guidelines

- **Accuracy**: Never compromise on content accuracy
- **Respect**: Honor the sacred nature of religious texts
- **Accessibility**: Make content available to all users
- **Benefit**: Ensure content provides genuine spiritual benefit

## Implementation Examples

### Content Curation Workflow

1. **Source Selection**: Choose appropriate Islamic source
2. **Content Extraction**: Extract relevant verse/hadith/term
3. **Translation**: Obtain or create accurate translation
4. **Context Research**: Research historical and spiritual context
5. **Mood Mapping**: Determine appropriate emotional states
6. **Verification**: Scholarly review and verification
7. **Formatting**: Proper database formatting
8. **Testing**: User testing and feedback
9. **Deployment**: Add to content database

### Quality Control Example

```python
def verify_quranic_verse(surah, ayah, translation):
    # Check source accuracy
    source_check = verify_quran_source(surah, ayah)

    # Verify translation accuracy
    translation_check = cross_reference_translations(translation)

    # Check context appropriateness
    context_check = verify_historical_context(surah, ayah)

    # Mood mapping validation
    mood_check = validate_emotional_association(surah, ayah)

    return all([source_check, translation_check, context_check, mood_check])
```

## Reference Materials

### Recommended Sources

- **Quran**: King Fahd Quran Complex, Sahih International
- **Hadith**: Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi
- **Scholars**: Al-Ghazali, Ibn Taymiyyah, Al-Nawawi, contemporary scholars
- **Translations**: Yusuf Ali, Sahih International, Muhsin Khan

### Scholarly Resources

- **Tafsir**: Ibn Kathir, Al-Tabari, Al-Qurtubi
- **Fiqh**: Reliance of the Traveller, Al-Mughni
- **Islamic Psychology**: Works on Islamic spiritual psychology

This skill ensures that all Islamic content in the app maintains the highest standards of accuracy, cultural sensitivity, and spiritual benefit.
