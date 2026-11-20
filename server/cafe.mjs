#!/usr/bin/env node
/**
 * Local server for Cozy Matcha Cafe: the game, Supabase accounts, and Resend password reset.
 *
 * Usage:
 *   node server/cafe.mjs
 *
 * Reads .env in the repo root. Passwords are sent to Supabase Auth, which stores a bcrypt
 * hash in auth.users. This process never writes a password to disk.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameRoot = path.join(root, 'game');
const port = Number(process.env.PORT || 8787);

loadEnv(path.join(root, '.env'));

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendKey = process.env.RESEND_API_KEY || '';
const resendFrom = process.env.RESEND_FROM || '';
const appUrl = (process.env.APP_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const authReady = Boolean(supabaseUrl && anonKey && serviceKey);
const secureCookie = appUrl.startsWith('https://');
const forgotAt = new Map();

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, appUrl);
    if (url.pathname.startsWith('/api/')) {
      await route(req, res, url);
      return;
    }
    serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, {error: 'The cafe server hit a problem. Please try again.'});
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Cozy Matcha Cafe  http://127.0.0.1:${port}`);
  if (!authReady) console.log('Supabase: add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env');
  if (!resendKey || !resendFrom) console.log('Resend: add RESEND_API_KEY and RESEND_FROM to .env (needed for password reset)');
});

async function route(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/session') return session(req, res);
  if (req.method === 'POST' && url.pathname === '/api/signup') return signup(req, res);
  if (req.method === 'POST' && url.pathname === '/api/login') return login(req, res);
  if (req.method === 'POST' && url.pathname === '/api/logout') return logout(res);
  if (req.method === 'POST' && url.pathname === '/api/forgot') return forgot(req, res);
  if (req.method === 'POST' && url.pathname === '/api/reset') return resetPassword(req, res);
  if (req.method === 'GET' && url.pathname === '/api/save') return readSave(req, res);
  if (req.method === 'PUT' && url.pathname === '/api/save') return writeSave(req, res);
  send(res, 404, {error: 'Not found'});
}

function requireAuth() {
  if (authReady) return null;
  return 'Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env, then restart the cafe server.';
}

async function signup(req, res) {
  const missing = requireAuth();
  if (missing) return send(res, 503, {error: missing});
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const invalid = checkPassword(password) || checkEmail(email);
  if (invalid) return send(res, 400, {error: invalid});
  const created = await supabase('/auth/v1/admin/users', {
    key: serviceKey,
    method: 'POST',
    body: {email, password, email_confirm: true}
  });
  if (!created.ok) {
    const taken = created.status === 422 || /already/i.test(created.message || '');
    return send(res, taken ? 409 : 400, {error: taken ? 'That email already has a shift. Sign in instead.' : 'Could not create the account. Check the email and try again.'});
  }
  const id = created.data?.id || created.data?.user?.id;
  if (id) {
    await supabase('/rest/v1/cozy_matcha_users', {
      key: serviceKey,
      method: 'POST',
      prefer: 'resolution=ignore-duplicates',
      body: {id, email}
    });
  }
  const signed = await passwordGrant(email, password);
  if (!signed.ok) return send(res, 201, {ok: true, email});
  setSession(res, signed.data);
  send(res, 201, {ok: true, email});
}

async function login(req, res) {
  const missing = requireAuth();
  if (missing) return send(res, 503, {error: missing});
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (checkEmail(email) || !password) return send(res, 400, {error: 'Enter the email and password for your shift.'});
  const signed = await passwordGrant(email, password);
  if (!signed.ok) return send(res, 401, {error: 'That email and password did not match.'});
  setSession(res, signed.data);
  send(res, 200, {ok: true, email: signed.data.user?.email || email});
}

function logout(res) {
  res.setHeader('Set-Cookie', [cookie('cafe_at', '', 0), cookie('cafe_rt', '', 0)]);
  send(res, 200, {ok: true});
}

async function forgot(req, res) {
  const missing = [
    !supabaseUrl && 'SUPABASE_URL',
    !anonKey && 'SUPABASE_ANON_KEY',
    !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    !resendKey && 'RESEND_API_KEY',
    !resendFrom && 'RESEND_FROM'
  ].filter(Boolean);
  if (missing.length) {
    return send(res, 503, {error: `Add ${missing.join(', ')} to .env, then restart the cafe server.`});
  }
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  if (checkEmail(email)) return send(res, 400, {error: 'Enter the email on your cafe account.'});
  const quiet = {ok: true, message: 'If that email has a cafe account, a reset link is on its way.'};
  const last = forgotAt.get(email) || 0;
  if (Date.now() - last < 60_000) return send(res, 200, quiet);
  forgotAt.set(email, Date.now());
  const link = await supabase('/auth/v1/admin/generate_link', {
    key: serviceKey,
    method: 'POST',
    body: {type: 'recovery', email}
  });
  const token = link.data?.hashed_token || link.data?.properties?.hashed_token;
  if (!link.ok || !token) return send(res, 200, quiet);
  const resetUrl = `${appUrl}/?recovery=${encodeURIComponent(token)}`;
  const mailed = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: 'Reset your Cozy Matcha Cafe password',
      html: `<p>Someone asked to reset the password for your Cozy Matcha Cafe shift.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>If you did not ask, you can ignore this email. The link expires soon.</p>`
    })
  });
  if (!mailed.ok) {
    const detail = await mailed.json().catch(() => ({}));
    console.error('Resend error', mailed.status, detail.message || detail.name || '');
    return send(res, 502, {error: 'The reset email could not be sent. Check RESEND_API_KEY and RESEND_FROM in .env.'});
  }
  send(res, 200, quiet);
}

async function resetPassword(req, res) {
  const missing = requireAuth();
  if (missing) return send(res, 503, {error: missing});
  const body = await readJson(req);
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const invalid = checkPassword(password);
  if (!token || token.length > 4000) return send(res, 400, {error: 'This reset link is incomplete. Ask for a new one.'});
  if (invalid) return send(res, 400, {error: invalid});
  const verified = await supabase('/auth/v1/verify', {
    key: anonKey,
    method: 'POST',
    body: {type: 'recovery', token_hash: token}
  });
  if (!verified.ok || !verified.data?.access_token) {
    return send(res, 400, {error: 'This reset link has expired. Ask for a new one.'});
  }
  const updated = await supabase('/auth/v1/user', {
    key: anonKey,
    method: 'PUT',
    token: verified.data.access_token,
    body: {password}
  });
  if (!updated.ok) return send(res, 400, {error: 'The new password was not saved. Ask for another reset link.'});
  setSession(res, verified.data);
  send(res, 200, {ok: true, email: verified.data.user?.email || updated.data?.email || ''});
}

async function session(req, res) {
  if (!authReady) return send(res, 200, {auth: false});
  const active = await freshSession(req, res);
  if (!active) return send(res, 200, {auth: true, email: null});
  send(res, 200, {auth: true, email: active.email});
}

async function readSave(req, res) {
  const missing = requireAuth();
  if (missing) return send(res, 503, {error: missing});
  const active = await freshSession(req, res);
  if (!active) return send(res, 401, {error: 'Sign in to load your shift.'});
  const listed = await supabase(`/rest/v1/cozy_matcha_saves?user_id=eq.${active.id}&select=progress,updated_at`, {
    key: anonKey,
    token: active.access
  });
  if (!listed.ok) return send(res, 502, {error: schemaHint(listed)});
  const row = Array.isArray(listed.data) ? listed.data[0] : null;
  send(res, 200, {progress: row?.progress || null});
}

async function writeSave(req, res) {
  const missing = requireAuth();
  if (missing) return send(res, 503, {error: missing});
  const active = await freshSession(req, res);
  if (!active) return send(res, 401, {error: 'Sign in to save your shift.'});
  const body = await readJson(req);
  if (!body.progress || typeof body.progress !== 'object' || Array.isArray(body.progress)) {
    return send(res, 400, {error: 'The shift could not be read.'});
  }
  const progress = JSON.parse(JSON.stringify(body.progress));
  const raw = JSON.stringify(progress);
  if (raw.length > 80_000) return send(res, 413, {error: 'That shift is too large to store.'});
  const saved = await supabase('/rest/v1/cozy_matcha_saves', {
    key: anonKey,
    token: active.access,
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: {user_id: active.id, progress, updated_at: new Date().toISOString()}
  });
  if (!saved.ok) return send(res, 502, {error: schemaHint(saved)});
  send(res, 200, {ok: true});
}

async function passwordGrant(email, password) {
  return supabase('/auth/v1/token?grant_type=password', {
    key: anonKey,
    method: 'POST',
    body: {email, password}
  });
}

async function freshSession(req, res) {
  const jar = cookies(req);
  let access = jar.cafe_at || '';
  let refresh = jar.cafe_rt || '';
  let payload = access ? jwtPayload(access) : null;
  if (!payload && refresh) {
    const next = await supabase('/auth/v1/token?grant_type=refresh_token', {
      key: anonKey,
      method: 'POST',
      body: {refresh_token: refresh}
    });
    if (!next.ok) return null;
    setSession(res, next.data);
    access = next.data.access_token;
    payload = jwtPayload(access);
  }
  if (!payload?.sub) return null;
  return {id: payload.sub, email: payload.email || '', access};
}

function setSession(res, data) {
  const access = data.access_token;
  const refresh = data.refresh_token;
  const accessMax = Math.max(60, Number(data.expires_in) || 3600);
  res.setHeader('Set-Cookie', [
    cookie('cafe_at', access, accessMax),
    cookie('cafe_rt', refresh, 60 * 60 * 24 * 30)
  ]);
}

async function supabase(pathname, {key, method = 'GET', body, token, prefer} = {}) {
  const headers = {apikey: key, 'Content-Type': 'application/json'};
  if (token || key === serviceKey) headers.Authorization = `Bearer ${token || key}`;
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(supabaseUrl + pathname, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => null);
  const message = data?.msg || data?.message || data?.error_description || data?.error || '';
  return {ok: response.ok, status: response.status, data, message: typeof message === 'string' ? message : ''};
}

function schemaHint(result) {
  if (/cozy_matcha/i.test(result.message || '') || result.status === 404) {
    return 'Run supabase/schema.sql in the Supabase SQL editor, then try again.';
  }
  return 'The shift could not reach Supabase. Check the keys in .env.';
}

function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(gameRoot, decodeURIComponent(requested)));
  if (!file.startsWith(gameRoot + path.sep) && file !== gameRoot) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache'});
    fs.createReadStream(file).pipe(res);
  });
}

function cookie(name, value, maxAge) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (secureCookie) parts.push('Secure');
  return parts.join('; ');
}

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

function jwtPayload(token) {
  try {
    const body = token.split('.')[1];
    const json = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!json?.sub || (json.exp && json.exp * 1000 < Date.now() + 15_000)) return null;
    return json;
  } catch {
    return null;
  }
}

function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function checkEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200 ? '' : 'Enter a real email address.';
}

function checkPassword(password) {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 72) return 'Use 72 characters or fewer.';
  return '';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 100_000) {
        reject(Object.assign(new Error('too large'), {status: 413}));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body)});
  res.end(body);
}

function loadEnv(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); }
  catch { return; }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
