import { parseCsv, parseCsvRecords } from '../lib/csvParse';
import { toCsv } from '../lib/csv';

describe('parseCsv', () => {
  it('parses plain rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('keeps commas inside quoted fields', () => {
    expect(parseCsv('name,desc\n"Smith, Bob",hi')).toEqual([['name', 'desc'], ['Smith, Bob', 'hi']]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('q\n"say ""hi"""')).toEqual([['q'], ['say "hi"']]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([['a'], ['line1\nline2']]);
  });

  it('handles CRLF line endings without leaking \\r', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('survives a missing trailing newline', () => {
    expect(parseCsv('a\n1')).toEqual([['a'], ['1']]);
  });
});

describe('parseCsvRecords', () => {
  it('keys rows by lowercased headers', () => {
    const recs = parseCsvRecords('Card Name,List Name\nDesign logo,Doing');
    expect(recs).toEqual([{ 'card name': 'Design logo', 'list name': 'Doing' }]);
  });

  it('returns nothing for a header-only file', () => {
    expect(parseCsvRecords('a,b')).toEqual([]);
  });
});

describe('toCsv → parseCsv round trip', () => {
  it('survives values containing commas, quotes and newlines', () => {
    const rows = [{ a: 'x,y', b: 'say "hi"', c: 'line1\nline2' }];
    const parsed = parseCsvRecords(toCsv(rows));
    expect(parsed[0]).toEqual({ a: 'x,y', b: 'say "hi"', c: 'line1\nline2' });
  });
});
