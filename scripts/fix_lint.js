/**
 * Automated lint fixer for mechanical ESLint issues:
 * 1. Remove unused imports (from import { A, B, C } lines)
 * 2. Prefix unused variables with _ (catch(e), destructured unused, etc.)
 * 3. Remove unused StyleSheet entries
 * 4. Fix no-useless-escape
 * 5. Fix react/no-unescaped-entities
 */

const fs = require('fs');
const path = require('path');

const eslintData = JSON.parse(fs.readFileSync('eslint_clean2.json', 'utf8'));
const srcBase = path.resolve('src');

// Group messages by file
const fileMessages = {};
eslintData.forEach((f) => {
  if (f.errorCount + f.warningCount === 0) return;
  const relPath = path.relative(srcBase, f.filePath);
  fileMessages[f.filePath] = f.messages;
});

let totalFixed = 0;

Object.entries(fileMessages).forEach(([filePath, messages]) => {
  if (!fs.existsSync(filePath)) return;
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let modified = false;

  // Sort messages by line number descending so we can modify from bottom up
  const sorted = [...messages].sort((a, b) => b.line - a.line);

  // Track which lines to delete
  const linesToDelete = new Set();
  // Track style names to remove
  const unusedStyles = [];

  sorted.forEach((msg) => {
    const lineIdx = msg.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) return;

    // --- 1. Unused imports ---
    if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
      const match = msg.message.match(/'([^']+)' is defined but never used/);
      if (!match) return;
      const varName = match[1];
      const line = lines[lineIdx];

      // Case A: Named import like `import { A, B, C } from '...'`
      if (line.match(/^\s*import\s+\{/) && line.includes(varName)) {
        // Check if it's the only import
        const importMatch = line.match(/import\s+\{([^}]+)\}\s+from/);
        if (importMatch) {
          const imports = importMatch[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (imports.length === 1 && imports[0] === varName) {
            // Only import — delete the line
            linesToDelete.add(lineIdx);
            totalFixed++;
            modified = true;
          } else {
            // Multiple imports — remove just this one
            const newImports = imports.filter((i) => i !== varName);
            if (newImports.length < imports.length) {
              lines[lineIdx] = line.replace(/\{[^}]+\}/, '{ ' + newImports.join(', ') + ' }');
              totalFixed++;
              modified = true;
            }
          }
        }
        return;
      }

      // Case B: Default import `import X from '...'`
      if (line.match(new RegExp(`^\\s*import\\s+${varName}\\s+from`))) {
        linesToDelete.add(lineIdx);
        totalFixed++;
        modified = true;
        return;
      }

      // Case C: Unused catch(e) or catch(error) — prefix with _
      if (
        line.match(/catch\s*\(\s*(e|error|err)\s*\)/) &&
        ['e', 'error', 'err'].includes(varName)
      ) {
        lines[lineIdx] = line.replace(
          new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`),
          `catch (_${varName})`,
        );
        totalFixed++;
        modified = true;
        return;
      }

      // Case D: Destructured assignment  `const { a, b } = ...` or `const [a, b] = ...`
      // Just prefix unused with _
      if (line.includes(varName) && (line.includes('const {') || line.includes('const ['))) {
        // Simple word boundary replacement
        const re = new RegExp(`\\b${varName}\\b`);
        if (re.test(lines[lineIdx])) {
          // Only replace in the destructuring part (before =)
          const eqIdx = lines[lineIdx].indexOf('=');
          if (eqIdx > 0) {
            const before = lines[lineIdx].substring(0, eqIdx);
            const after = lines[lineIdx].substring(eqIdx);
            if (before.includes(varName) && !before.includes('_' + varName)) {
              lines[lineIdx] = before.replace(re, '_' + varName) + after;
              totalFixed++;
              modified = true;
            }
          }
        }
        return;
      }

      // Case E: Unused assigned variable `const x = ...` — prefix with _
      if (line.match(new RegExp(`(const|let|var)\\s+${varName}\\b`)) && !line.includes('import')) {
        lines[lineIdx] = line.replace(
          new RegExp(`(const|let|var)\\s+${varName}\\b`),
          `$1 _${varName}`,
        );
        totalFixed++;
        modified = true;
        return;
      }

      // Case F: Function parameter — prefix unused params with _
      if (
        msg.message.includes('is defined but never used') &&
        (line.match(/\(.*\b${varName}\b/) || line.includes(varName))
      ) {
        // For callback params like (event) => or (index) in .map((item, index))
        const paramRe = new RegExp(`([,(]\\s*)${varName}(\\s*[,):])`);
        if (paramRe.test(lines[lineIdx])) {
          lines[lineIdx] = lines[lineIdx].replace(paramRe, `$1_${varName}$2`);
          totalFixed++;
          modified = true;
        }
        return;
      }
    }

    // --- 2. no-useless-escape ---
    if (msg.ruleId === 'no-useless-escape') {
      // Remove unnecessary escape chars
      const escMatch = msg.message.match(/Unnecessary escape character: \\(.)/);
      if (escMatch) {
        const char = escMatch[1];
        const line = lines[lineIdx];
        // Replace \[ with [ etc, but carefully in the column area
        lines[lineIdx] = line.replace('\\' + char, char);
        totalFixed++;
        modified = true;
      }
    }

    // --- 3. react/no-unescaped-entities ---
    if (msg.ruleId === 'react/no-unescaped-entities') {
      const line = lines[lineIdx];
      // Replace unescaped ' with &apos; and " with &quot; in JSX text
      // Only fix if the line looks like JSX text (not inside attributes)
      if (msg.message.includes("`'`") || msg.message.includes("`'`")) {
        // Has unescaped single quote in JSX
        // Be careful: only replace ' that's in text content, not in JS expressions
        lines[lineIdx] = line.replace(/(\>.*?)'/g, '$1{"\'"}');
        totalFixed++;
        modified = true;
      }
      if (msg.message.includes('`"`') || msg.message.includes('`\\"`')) {
        lines[lineIdx] = lines[lineIdx].replace(/(\>.*?)"/g, '$1&quot;');
        totalFixed++;
        modified = true;
      }
    }

    // --- 4. Unused styles ---
    if (msg.ruleId === 'react-native/no-unused-styles') {
      const styleMatch = msg.message.match(/Unused style detected: ([a-zA-Z.]+)/);
      if (styleMatch) {
        unusedStyles.push({ name: styleMatch[1].split('.').pop(), line: msg.line });
      }
    }
  });

  // Remove unused style entries (from bottom to top)
  if (unusedStyles.length > 0) {
    const sortedStyles = unusedStyles.sort((a, b) => b.line - a.line);
    sortedStyles.forEach(({ name, line: styleLine }) => {
      const lineIdx = styleLine - 1;
      if (lineIdx >= lines.length) return;

      // Find the end of this style entry (next entry or closing })
      let endIdx = lineIdx;
      let braceDepth = 0;
      for (let i = lineIdx; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0) {
          endIdx = i;
          break;
        }
      }

      // Delete lines from lineIdx to endIdx (inclusive)
      // Also check for trailing comma on the line before
      for (let i = endIdx; i >= lineIdx; i--) {
        linesToDelete.add(i);
      }
      totalFixed++;
      modified = true;
    });
  }

  // Apply line deletions (bottom to top)
  if (linesToDelete.size > 0) {
    const sortedDeletes = [...linesToDelete].sort((a, b) => b - a);
    sortedDeletes.forEach((idx) => {
      lines.splice(idx, 1);
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    const relName = path.relative(srcBase, filePath).replace(/\\/g, '/');
    console.log('Fixed: ' + relName);
  }
});

console.log('\nTotal fixes applied: ' + totalFixed);
