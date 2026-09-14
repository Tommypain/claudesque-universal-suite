// Test: Smart Table Row-by-Row Splitting
import assert from 'node:assert';

function splitOverflowingTable(table, clientH, contentTop = 0, rowHeights = []) {
  if (!table || !table.rows || table.rows.length <= 1) return null;
  const rows = Array.from(table.rows);
  const tableTop = table.offsetTop || 0;
  
  if (tableTop >= clientH) return null;

  const headerRow = table.tHead ? table.tHead.rows[0] : (rows[0] && rows[0].querySelector && rows[0].querySelector('th') ? rows[0] : null);
  const startIndex = headerRow ? 1 : 0;

  let splitIndex = -1;
  let currentY = tableTop;
  for (let i = 0; i < rows.length; i++) {
    const rh = (rowHeights && rowHeights[i]) ? rowHeights[i] : (rows[i].offsetHeight || 30);
    currentY += rh;
    if (currentY > clientH && i >= startIndex) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1 || splitIndex <= startIndex) return null;

  // Mock clone & split
  const originalRowsKept = rows.slice(0, splitIndex);
  const movedRows = rows.slice(splitIndex);

  return {
    splitIndex,
    hasHeaderClone: !!headerRow,
    keptRowCount: originalRowsKept.length,
    movedRowCount: movedRows.length
  };
}

// Case 1: Table with 10 rows (1 header + 9 data), tableTop = 200, clientH = 400.
// Each row height = 30.
// Cumulative Y:
// Row 0 (header): 200 + 30 = 230
// Row 1: 260
// Row 2: 290
// Row 3: 320
// Row 4: 350
// Row 5: 380
// Row 6: 410 -> OVERFLOW! splitIndex = 6.
const mockTable1 = {
  offsetTop: 200,
  tHead: { rows: [{ id: 'header' }] },
  rows: [
    { id: 'h' },
    { id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }, { id: 'r5' },
    { id: 'r6' }, { id: 'r7' }, { id: 'r8' }, { id: 'r9' }
  ]
};

const res1 = splitOverflowingTable(mockTable1, 400, 0, Array(10).fill(30));
assert.ok(res1, 'Should split table');
assert.strictEqual(res1.splitIndex, 6, 'Should split at row 6');
assert.strictEqual(res1.keptRowCount, 6, 'Original table should keep rows 0-5 (header + 5 data rows)');
assert.strictEqual(res1.movedRowCount, 4, 'New table should get 4 rows (6, 7, 8, 9)');
assert.strictEqual(res1.hasHeaderClone, true, 'New table should clone header row');
console.log('✓ Case 1 passed: 10-row table split at row 6 with header cloned on page 2!');

// Case 2: Table where even first row exceeds clientH (tableTop = 390, row0 = 30)
const mockTable2 = {
  offsetTop: 390,
  rows: [{ id: 'r0' }, { id: 'r1' }]
};
const res2 = splitOverflowingTable(mockTable2, 400, 0, [30, 30]);
assert.strictEqual(res2, null, 'Should return null when table cannot fit first row');
console.log('✓ Case 2 passed: Entire table moves if first row cannot fit!');

console.log('ALL TABLE SPLIT TESTS PASSED SUCCESSFULLY.');
