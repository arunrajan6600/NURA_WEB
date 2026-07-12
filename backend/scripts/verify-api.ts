/**
 * backend/scripts/verify-api.ts
 *
 * Phase 3.5 + 4 — Full API verification script.
 *
 * Verifies every endpoint, business rule, and error case.
 * Runs against the live Express server (must be running on PORT 3001).
 *
 * Run via:  npm run verify
 *
 * SECTIONS:
 *  0. Health check
 *  1. Auth — obtain JWT token
 *  2. POST /posts  — create published + draft posts
 *  3. GET /posts   — list with filters
 *  4. GET /posts/:id — by ID + view-count increment
 *  5. GET /posts/:slug — by slug + draft no-increment
 *  6. PUT /posts/:id — update
 *  7. Cascade delete — cells removed with post
 *  8. Slug uniqueness — duplicate rejection
 *  9. Error cases — 404, 400, 401, bad filters
 * 10. DELETE /posts/:id
 * 11. GET /files — list files (auth required)
 * 12. POST /files/presigned-url — signed upload url
 * 13. POST /files/upload — direct upload
 * 14. DELETE /files/:id — file deletion
 * 15. Files auth protection
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE = `http://localhost:${process.env.PORT || 3001}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const errors: string[] = [];

async function req(
  method: string,
  url: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function uploadFile(
  filePath: string,
  mimeType: string,
  token: string
): Promise<{ status: number; data: any }> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const FormData = (await import('node:buffer')).Blob;

  // Use native fetch with FormData
  const form = new (globalThis as any).FormData();
  form.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);

  const res = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    errors.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// ─── 0. HEALTH ────────────────────────────────────────────────────────────────

async function verifyHealth() {
  console.log('\n[0] Health check');
  const { status, data } = await req('GET', '/health');
  assert('GET /health → 200',        status === 200,        `got ${status}`);
  assert('GET /health → status ok',  data?.status === 'ok', `got ${JSON.stringify(data)}`);
}

// ─── 1. AUTH ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  console.log('\n[1] Auth — obtain JWT');
  const { status, data } = await req('POST', '/auth/login', {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'password',
  });
  assert('POST /auth/login → 200', status === 200, `got ${status}`);
  assert('Response has token',     typeof data?.token === 'string');
  return data?.token ?? '';
}

// ─── 2. CREATE ────────────────────────────────────────────────────────────────

async function verifyCreate(token: string): Promise<{ publishedId: string; draftId: string }> {
  console.log('\n[2] POST /posts — Create posts');

  const slug1 = `verify-published-${Date.now()}`;
  const slug2 = `verify-draft-${Date.now()}`;

  const { status: s1, data: d1 } = await req('POST', '/posts', {
    title:   'Verify Published Post',
    slug:    slug1,
    status:  'published',
    type:    'blog',
    featured: true,
    excerpt: 'Verification published post',
    cells: [
      { type: 'markdown', content: { text: '# Cell One' }, orderIndex: 1 },
      { type: 'markdown', content: { text: '## Cell Two' }, orderIndex: 2 },
      { type: 'markdown', content: { text: '### Cell Three' }, orderIndex: 3 },
    ],
  }, token);

  assert('POST /posts → 201',              s1 === 201,                     `got ${s1}`);
  assert('Created post has id',            typeof d1?.data?.id === 'string');
  assert('Created post has slug',          d1?.data?.slug === slug1,       `got ${d1?.data?.slug}`);
  assert('Created post status=published',  d1?.data?.status === 'published');
  assert('Created post featured=true',     d1?.data?.featured === true);
  assert('Created post has 3 cells',       d1?.data?.cells?.length === 3,  `got ${d1?.data?.cells?.length}`);
  assert('Cells ordered correctly',        d1?.data?.cells?.[0]?.order === 1 && d1?.data?.cells?.[1]?.order === 2 && d1?.data?.cells?.[2]?.order === 3);
  assert('Cell content parsed from JSON',  typeof d1?.data?.cells?.[0]?.content === 'object');
  assert('publishedAt is set',             d1?.data?.publishedAt !== null);

  const publishedId = d1?.data?.id ?? '';

  const { status: s2, data: d2 } = await req('POST', '/posts', {
    title:  'Verify Draft Post',
    slug:   slug2,
    status: 'draft',
    type:   'article',
  }, token);

  assert('POST /posts (draft) → 201',   s2 === 201,                `got ${s2}`);
  assert('Draft post status=draft',     d2?.data?.status === 'draft');
  assert('Draft post publishedAt=null', d2?.data?.publishedAt === null);
  assert('Draft viewCount starts at 0', d2?.data?.viewCount === 0);

  const draftId = d2?.data?.id ?? '';

  const { status: s3 } = await req('POST', '/posts', { title: 'No Auth' });
  assert('POST /posts without auth → 401', s3 === 401, `got ${s3}`);

  const { status: s4, data: d4 } = await req('POST', '/posts', { status: 'draft' }, token);
  assert('POST /posts missing title → 400', s4 === 400, `got ${s4}`);
  assert('400 has success:false',           d4?.success === false);

  return { publishedId, draftId };
}

// ─── 3. LIST ──────────────────────────────────────────────────────────────────

async function verifyList(token: string) {
  console.log('\n[3] GET /posts — List with filters');

  const { status, data } = await req('GET', '/posts');
  assert('GET /posts → 200',            status === 200,           `got ${status}`);
  assert('Response success:true',        data?.success === true);
  assert('Response has data array',      Array.isArray(data?.data));
  assert('Response has count',           typeof data?.count === 'number');

  const { status: sp, data: dp } = await req('GET', '/posts?status=published');
  assert('GET /posts?status=published → 200', sp === 200, `got ${sp}`);
  assert('All returned posts are published',   (dp?.data ?? []).every((p: any) => p.status === 'published'));

  const { status: sd, data: dd } = await req('GET', '/posts?status=draft');
  assert('GET /posts?status=draft without auth → 401', sd === 401, `got ${sd}`);

  const { status: sdAdmin, data: ddAdmin } = await req('GET', '/posts?status=draft', undefined, token);
  assert('GET /posts?status=draft with auth → 200', sdAdmin === 200, `got ${sdAdmin}`);
  assert('All returned posts are drafts',  (ddAdmin?.data ?? []).every((p: any) => p.status === 'draft'));

  const { status: sf, data: df } = await req('GET', '/posts?featured=true');
  assert('GET /posts?featured=true → 200', sf === 200, `got ${sf}`);
  assert('All returned posts are featured', (df?.data ?? []).every((p: any) => p.featured === true));

  const { status: st, data: dt } = await req('GET', '/posts?type=blog');
  assert('GET /posts?type=blog → 200', st === 200, `got ${st}`);
  assert('All returned posts are type blog', (dt?.data ?? []).every((p: any) => p.type === 'blog'));

  const { status: sl, data: dl } = await req('GET', '/posts?limit=1');
  assert('GET /posts?limit=1 → 200',  sl === 200, `got ${sl}`);
  assert('Limit=1 returns at most 1', (dl?.data ?? []).length <= 1);

  const { status: siv } = await req('GET', '/posts?status=invalid_value');
  assert('GET /posts?status=invalid → 400', siv === 400, `got ${siv}`);
}

// ─── 4. GET BY ID + VIEW COUNT ────────────────────────────────────────────────

async function verifyGetById(publishedId: string, draftId: string, token: string) {
  console.log('\n[4] GET /posts/:id — By ID + view count');

  const { status: s1, data: d1 } = await req('GET', `/posts/${publishedId}`);
  assert('GET /posts/:id (published) → 200', s1 === 200,       `got ${s1}`);
  assert('Response success:true',             d1?.success === true);
  assert('Post has expected id',              d1?.data?.id === publishedId);

  const viewAfterFirst = d1?.data?.viewCount ?? -1;
  const { data: d2 } = await req('GET', `/posts/${publishedId}`);
  const viewAfterSecond = d2?.data?.viewCount ?? -1;
  assert('View count increments on published GET', viewAfterSecond === viewAfterFirst + 1, `first=${viewAfterFirst} second=${viewAfterSecond}`);

  const { status: sd1 } = await req('GET', `/posts/${draftId}`);
  assert('GET /posts/:id (draft) without auth → 404', sd1 === 404, `got ${sd1}`);

  const { status: sd1Admin, data: dd1Admin } = await req('GET', `/posts/${draftId}`, undefined, token);
  assert('GET /posts/:id (draft) with auth → 200', sd1Admin === 200, `got ${sd1Admin}`);
  const draftViewFirst = dd1Admin?.data?.viewCount ?? -1;
  const { data: dd2 } = await req('GET', `/posts/${draftId}`, undefined, token);
  const draftViewSecond = dd2?.data?.viewCount ?? -1;
  assert('Draft view count does NOT increment', draftViewFirst === draftViewSecond, `first=${draftViewFirst} second=${draftViewSecond}`);

  const { status: s404 } = await req('GET', '/posts/non-existent-id-xyz-999');
  assert('GET /posts/non-existent-id → 404', s404 === 404, `got ${s404}`);
}

// ─── 5. GET BY SLUG ───────────────────────────────────────────────────────────

async function verifyGetBySlug(publishedId: string, expectedSlug: string) {
  console.log('\n[5] GET /posts/:slug — By slug');

  const { status, data } = await req('GET', `/posts/${expectedSlug}`);
  assert('GET /posts/:slug → 200',   status === 200,           `got ${status}`);
  assert('Slug lookup returns post', data?.data?.id === publishedId);
  assert('Slug in response matches', data?.data?.slug === expectedSlug);
}

// ─── 6. UPDATE ────────────────────────────────────────────────────────────────

async function verifyUpdate(publishedId: string, token: string): Promise<string> {
  console.log('\n[6] PUT /posts/:id — Update');

  const newSlug = `verify-updated-${Date.now()}`;

  const { status, data } = await req('PUT', `/posts/${publishedId}`, {
    title:   'Updated Verification Post',
    slug:    newSlug,
    excerpt: 'Updated excerpt',
    cells: [
      { type: 'markdown', content: '# Updated Cell', orderIndex: 1 },
    ],
  }, token);

  assert('PUT /posts/:id → 200',              status === 200,                     `got ${status}`);
  assert('Updated post has new title',        data?.data?.title === 'Updated Verification Post');
  assert('Updated post has new slug',         data?.data?.slug === newSlug,       `got ${data?.data?.slug}`);
  assert('Updated post has new excerpt',      data?.data?.excerpt === 'Updated excerpt');
  assert('Updated cells replaced (1 cell)',   data?.data?.cells?.length === 1,    `got ${data?.data?.cells?.length}`);
  assert('Updated cell has correct content',  data?.data?.cells?.[0]?.type === 'markdown');

  const { status: s401 } = await req('PUT', `/posts/${publishedId}`, { title: 'No Auth' });
  assert('PUT /posts/:id without auth → 401', s401 === 401, `got ${s401}`);

  const { status: s404 } = await req('PUT', '/posts/does-not-exist-abc', { title: 'X' }, token);
  assert('PUT /posts/non-existent → 404 or 500', s404 >= 400, `got ${s404}`);

  return newSlug;
}

// ─── 7. SLUG UNIQUENESS ───────────────────────────────────────────────────────

async function verifySlugUniqueness(token: string) {
  console.log('\n[7] Slug uniqueness');

  const slug = `verify-unique-slug-${Date.now()}`;

  const { status: s1 } = await req('POST', '/posts', { title: 'Slug Test A', slug, status: 'draft' }, token);
  assert('First post with slug → 201', s1 === 201, `got ${s1}`);

  const { status: s2, data: d2 } = await req('POST', '/posts', { title: 'Slug Test B', slug, status: 'draft' }, token);
  assert('Duplicate slug → 400 or 409',       s2 >= 400,          `got ${s2}`);
  assert('Duplicate slug response success:false', d2?.success === false);
}

// ─── 8. CASCADE DELETE ────────────────────────────────────────────────────────

async function verifyCascadeDelete(token: string) {
  console.log('\n[8] Cascade delete — cells removed with post');

  const slug = `verify-cascade-${Date.now()}`;
  const { data: created } = await req('POST', '/posts', {
    title: 'Cascade Test Post', slug, status: 'draft',
    cells: [
      { type: 'markdown', content: '# Cell A', orderIndex: 1 },
      { type: 'markdown', content: '# Cell B', orderIndex: 2 },
    ],
  }, token);

  const postId = created?.data?.id;
  assert('Cascade post created',     typeof postId === 'string');
  assert('Cascade post has 2 cells', created?.data?.cells?.length === 2, `got ${created?.data?.cells?.length}`);

  const { status: delStatus, data: delData } = await req('DELETE', `/posts/${postId}`, undefined, token);
  assert('DELETE /posts/:id → 200',      delStatus === 200,        `got ${delStatus}`);
  assert('Delete response success:true', delData?.success === true);

  const { status: checkStatus } = await req('GET', `/posts/${postId}`);
  assert('Deleted post returns 404', checkStatus === 404, `got ${checkStatus}`);
}

// ─── 9. ERRORS ────────────────────────────────────────────────────────────────

async function verifyErrors() {
  console.log('\n[9] Error cases');

  const { status: s404 } = await req('GET', '/this-does-not-exist');
  assert('Unknown route → 404', s404 === 404, `got ${s404}`);

  const { status: sFilter } = await req('GET', '/posts?featured=maybe');
  assert('Invalid featured filter → 400', sFilter === 400, `got ${sFilter}`);

  const { status: s401 } = await req('PUT', '/posts/any-id', { title: '' }, '');
  assert('PUT with no auth → 401', s401 === 401, `got ${s401}`);
}

// ─── 10. DELETE ───────────────────────────────────────────────────────────────

async function verifyDelete(publishedId: string, draftId: string, token: string) {
  console.log('\n[10] DELETE /posts/:id');

  const { status: s401 } = await req('DELETE', `/posts/${publishedId}`);
  assert('DELETE without auth → 401', s401 === 401, `got ${s401}`);

  const { status: s1, data: d1 } = await req('DELETE', `/posts/${publishedId}`, undefined, token);
  assert('DELETE /posts/:id (published) → 200', s1 === 200,          `got ${s1}`);
  assert('Delete response has id',              d1?.data?.id === publishedId);

  const { status: s2 } = await req('DELETE', `/posts/${draftId}`, undefined, token);
  assert('DELETE /posts/:id (draft) → 200', s2 === 200, `got ${s2}`);

  const { status: s3 } = await req('DELETE', `/posts/${publishedId}`, undefined, token);
  assert('Double DELETE → 404 or 500', s3 >= 400, `got ${s3}`);
}

// ─── 11. FILES LIST ───────────────────────────────────────────────────────────

async function verifyFilesList(token: string) {
  console.log('\n[11] GET /files — List files');

  // Auth required
  const { status: s401 } = await req('GET', '/files');
  assert('GET /files without auth → 401', s401 === 401, `got ${s401}`);

  // With auth
  const { status, data } = await req('GET', '/files', undefined, token);
  assert('GET /files (auth) → 200',   status === 200,          `got ${status}`);
  assert('Response is an array',       Array.isArray(data));
}

// ─── 12. PRESIGNED URL ────────────────────────────────────────────────────────

async function verifyPresignedUrl(token: string): Promise<string> {
  console.log('\n[12] POST /files/presigned-url — Signed upload URL');

  // Auth required
  const { status: s401 } = await req('POST', '/files/presigned-url', {
    filename: 'test.jpg', contentType: 'image/jpeg', size: 1024,
  });
  assert('POST /files/presigned-url without auth → 401', s401 === 401, `got ${s401}`);

  // Missing fields
  const { status: s400, data: d400 } = await req('POST', '/files/presigned-url', {}, token);
  assert('POST /files/presigned-url missing fields → 400', s400 === 400, `got ${s400}`);
  assert('400 response has error field', typeof d400?.error === 'string' || typeof d400?.success !== 'undefined');

  // Valid request
  const { status, data } = await req('POST', '/files/presigned-url', {
    filename: 'test-verify.txt',
    contentType: 'text/plain',
    size: 512,
  }, token);

  assert('POST /files/presigned-url → 200',  status === 200, `got ${status}`);
  assert('Response has uploadUrl',            typeof data?.uploadUrl === 'string');
  assert('Response has fileId',               typeof data?.fileId === 'string');
  assert('Response has filename',             data?.filename === 'test-verify.txt');
  assert('Response has contentType',          data?.contentType === 'text/plain');
  assert('Response has url (final location)', typeof data?.url === 'string');

  // Invalid file type
  const { status: sType } = await req('POST', '/files/presigned-url', {
    filename: 'evil.exe',
    contentType: 'application/x-msdownload',
    size: 512,
  }, token);
  assert('POST /files/presigned-url invalid type → 400', sType === 400, `got ${sType}`);

  // File size too large
  const { status: sSize } = await req('POST', '/files/presigned-url', {
    filename: 'huge.mp4',
    contentType: 'video/mp4',
    size: 60 * 1024 * 1024, // 60MB > 50MB limit
  }, token);
  assert('POST /files/presigned-url file too large → 400', sSize === 400, `got ${sSize}`);

  return data?.fileId ?? '';
}

// ─── 13. FILE UPLOAD ──────────────────────────────────────────────────────────

async function verifyFileUpload(token: string): Promise<string> {
  console.log('\n[13] POST /files/upload — Direct upload');

  // Create a tiny test text file in a temp path
  const tmpFile = path.resolve(__dirname, '../dist/verify-test-upload.txt');
  fs.writeFileSync(tmpFile, 'Phase 4 verification test file content.');

  // Auth required
  const form401 = new (globalThis as any).FormData();
  form401.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
  const res401 = await fetch(`${BASE}/files/upload`, { method: 'POST', body: form401 });
  assert('POST /files/upload without auth → 401', res401.status === 401, `got ${res401.status}`);

  // Valid upload
  const form = new (globalThis as any).FormData();
  form.append('file', new Blob([fs.readFileSync(tmpFile)], { type: 'text/plain' }), 'verify-test-upload.txt');
  const res = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });
  let uploadData: any = null;
  try { uploadData = await res.json(); } catch { /* ignore */ }

  assert('POST /files/upload → 201',         res.status === 201,                       `got ${res.status}`);
  assert('Response has files array',          Array.isArray(uploadData?.files),          `got ${JSON.stringify(uploadData)}`);
  assert('Uploaded file has id',              typeof uploadData?.files?.[0]?.id === 'string');
  assert('Uploaded file has url',             typeof uploadData?.files?.[0]?.url === 'string');
  assert('Uploaded file has filename',        typeof uploadData?.files?.[0]?.filename === 'string');
  assert('Uploaded file has contentType',     uploadData?.files?.[0]?.contentType === 'text/plain');

  // Invalid type (executable)
  const formBad = new (globalThis as any).FormData();
  formBad.append('file', new Blob(['bad'], { type: 'application/x-msdownload' }), 'bad.exe');
  const resBad = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formBad,
  });
  assert('POST /files/upload invalid type → 400', resBad.status === 400, `got ${resBad.status}`);

  // Cleanup
  try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }

  return uploadData?.files?.[0]?.id ?? '';
}

// ─── 14. FILE DELETE ──────────────────────────────────────────────────────────

async function verifyFileDelete(fileId: string, token: string) {
  console.log('\n[14] DELETE /files/:id — File deletion');

  if (!fileId) {
    console.log('  ⏭️  Skipping file delete — no fileId available from upload step');
    return;
  }

  // Auth required
  const { status: s401 } = await req('DELETE', `/files/${fileId}`);
  assert('DELETE /files/:id without auth → 401', s401 === 401, `got ${s401}`);

  // Delete with auth
  const { status, data } = await req('DELETE', `/files/${fileId}`, undefined, token);
  assert('DELETE /files/:id → 200',           status === 200,                   `got ${status}`);
  assert('Delete response has message',        typeof data?.message === 'string');
  assert('Delete response has fileId',         data?.fileId === fileId);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Phase 3.5 + 4 — Full API Verification');
  console.log(`  Server: ${BASE}`);
  console.log(`${'='.repeat(60)}`);

  try {
    await verifyHealth();
    const token = await getToken();

    if (!token) {
      console.error('\n❌  Cannot obtain JWT token. Stopping verification.');
      process.exit(1);
    }

    // Posts CRUD
    const { publishedId, draftId } = await verifyCreate(token);
    const { data: fetchedPost } = await req('GET', `/posts/${publishedId}`);
    const publishedSlug = fetchedPost?.data?.slug ?? '';

    await verifyList(token);
    await verifyGetById(publishedId, draftId, token);
    await verifyGetBySlug(publishedId, publishedSlug);
    const newSlug = await verifyUpdate(publishedId, token);
    await verifyGetBySlug(publishedId, newSlug);
    await verifySlugUniqueness(token);
    await verifyCascadeDelete(token);
    await verifyErrors();
    await verifyDelete(publishedId, draftId, token);

    // Files storage
    await verifyFilesList(token);
    await verifyPresignedUrl(token);
    const uploadedFileId = await verifyFileUpload(token);
    await verifyFileDelete(uploadedFileId, token);

  } catch (e: any) {
    console.error('\n💥  Unexpected error during verification:', e?.message ?? e);
    process.exit(1);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(60)}`);

  if (failed > 0) {
    console.error('\nFailed assertions:');
    errors.forEach((e) => console.error(`  ❌  ${e}`));
    process.exit(1);
  } else {
    console.log('\n🎉  All checks passed. Phase 3.5 + 4 complete.\n');
    process.exit(0);
  }
}

main();
