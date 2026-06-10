const QURAN_API_BASE = 'https://api.quran.com/api/v4';

async function testFetch() {
  const url = `${QURAN_API_BASE}/verses/by_key/93:4?translations=131&words=true&word_fields=text_uthmani`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testFetch();
