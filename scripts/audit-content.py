import re

# Read quranData.ts
with open('src/data/quranData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all content items
items_pattern = r'\{[^}]*id:\s*\'(quran_\d+_\d+)\'[^}]*moods:\s*\[([^\]]+)\][^}]*\}'
items = re.findall(items_pattern, content, re.DOTALL)

mood_issues = {}
all_moods = ['Anxious', 'Sad', 'Angry', 'Guilty', 'Grateful', 'Content', 'Calm', 'Stressed', 'Hopeful', 'Energized']

for mood in all_moods:
    mood_issues[mood] = []

total_issues = 0

# For each content item, find its full block and check fields
for item_match in re.finditer(r'\{\s*id:\s*\'(quran_\d+_\d+)\',.*?moods:\s*\[([^\]]+)\]', content, re.DOTALL):
   full_start = item_match.start()
    # Find the closing brace
    brace_count = 0
    pos = full_start
    in_item = False
    full_end = full_start
    
    for i, char in enumerate(content[full_start:], start=full_start):
        if char == '{':
            brace_count += 1
            in_item = True
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and in_item:
                full_end = i + 1
                break
    
    item_text = content[full_start:full_end]
    item_id = item_match.group(1)
    moods_text = item_match.group(2)
    
    # Extract moods
    moods = re.findall(r"'([^']+)'", moods_text)
    
    # Check fields
    issues = []
    if not re.search(r"audioKey:\s*'[^']+'", item_text):
        issues.append('missing audioKey')
    if not re.search(r"arabicText:\s*'[^']+'", item_text):
        issues.append('missing arabicText')
    if not re.search(r"transliteration:\s*'[^']+'", item_text):
        issues.append('missing transliteration')
    if not re.search(r"englishTranslation:\s*[\r\n\s]*'[^']+'", item_text):
        issues.append('missing englishTranslation')
    
    if issues:
        total_issues += 1
        for mood in moods:
            if mood in mood_issues:
                mood_issues[mood].append(f"{item_id}: {', '.join(issues)}")

# Print report
print('\n=== CONTENT AUDIT REPORT ===\n')
for mood in all_moods:
    items = mood_issues[mood]
    print(f'\n📊 {mood.upper()}: {len(items)} incomplete verse(s)')
    for item in items:
        print(f'   ❌ {item}')

print(f'\n\n🔍 SUMMARY: Found {total_issues} incomplete verse(s) across all moods\n')

# Save to file
with open('audit-report.txt', 'w', encoding='utf-8') as f:
    f.write('=== CONTENT AUDIT REPORT ===\n\n')
    for mood in all_moods:
        items = mood_issues[mood]
        f.write(f'\n{mood.upper()}: {len(items)} incomplete verse(s)\n')
        for item in items:
            f.write(f'  - {item}\n')
    f.write(f'\n\nSUMMARY: Found {total_issues} incomplete verse(s) across all moods\n')

print('✅ Full report saved to audit-report.txt')
