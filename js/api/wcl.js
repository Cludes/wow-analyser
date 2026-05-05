const GQL_CLIENT_ENDPOINT = 'https://www.warcraftlogs.com/api/v2/client';
const GQL_USER_ENDPOINT   = 'https://www.warcraftlogs.com/api/v2/user';
const TOKEN_ENDPOINT      = 'https://www.warcraftlogs.com/oauth/token';
const AUTH_ENDPOINT       = 'https://www.warcraftlogs.com/oauth/authorize';

class WCLClient {
  constructor() {
    this._token       = null;
    this._tokenExpiry = 0;
  }

  // --- credentials (manual fallback only) ---

  get clientId()     { return localStorage.getItem('wcl_client_id')     || ''; }
  get clientSecret() { return localStorage.getItem('wcl_client_secret') || ''; }

  setCredentials(id, secret) {
    localStorage.setItem('wcl_client_id',     id);
    localStorage.setItem('wcl_client_secret', secret);
    this._token       = null;
    this._tokenExpiry = 0;
  }

  hasCredentials() { return !!(this.clientId && this.clientSecret); }

  // --- user auth state ---

  isLoggedIn() {
    const token  = localStorage.getItem('wcl_access_token');
    const expiry = parseInt(localStorage.getItem('wcl_token_expiry') ?? '0');
    return !!(token && Date.now() < expiry);
  }

  logout() {
    localStorage.removeItem('wcl_access_token');
    localStorage.removeItem('wcl_token_expiry');
    localStorage.removeItem('wcl_refresh_token');
    this._token       = null;
    this._tokenExpiry = 0;
  }

  // --- OAuth authorization code flow ---

  get _redirectUri() {
    return window.location.origin + window.location.pathname;
  }

  startAuthFlow() {
    if (!this.clientId) throw new Error('Enter your Client ID first.');
    const state = crypto.randomUUID();
    sessionStorage.setItem('wcl_oauth_state', state);
    const params = new URLSearchParams({
      client_id:     this.clientId,
      redirect_uri:  this._redirectUri,
      response_type: 'code',
      scope:         'view-user-profile view-private-reports',
      state,
    });
    window.location.href = `${AUTH_ENDPOINT}?${params}`;
  }

  // Call on page load - returns true if a callback was handled
  async handleAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    if (!code) return false;

    const saved = sessionStorage.getItem('wcl_oauth_state');
    sessionStorage.removeItem('wcl_oauth_state');
    if (state !== saved) throw new Error('OAuth state mismatch - possible CSRF attack.');
    if (!this.hasCredentials()) throw new Error('Client credentials missing. Re-enter your Client ID and Secret.');

    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:  'Basic ' + _basicAuth(this.clientId, this.clientSecret),
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: this._redirectUri,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Token exchange failed (${resp.status}): ${txt}`);
    }

    const data = await resp.json();
    _storeUserToken(data);
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  }

  // --- token resolution (priority: user token > refresh > client_credentials) ---

  async _fetchToken() {
    // 1. Valid user token in localStorage
    const stored       = localStorage.getItem('wcl_access_token');
    const storedExpiry = parseInt(localStorage.getItem('wcl_token_expiry') ?? '0');
    if (stored && Date.now() < storedExpiry) return stored;

    // 2. Try refresh token
    const refresh = localStorage.getItem('wcl_refresh_token');
    if (refresh) {
      try {
        await this._refreshUserToken(refresh);
        return localStorage.getItem('wcl_access_token');
      } catch {
        this.logout();
      }
    }

    // 3. Client credentials fallback (public reports only)
    if (!this.hasCredentials()) {
      throw new Error('Not logged in. Click "Login with WarcraftLogs" to authenticate.');
    }
    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:  'Basic ' + _basicAuth(this.clientId, this.clientSecret),
      },
      body: 'grant_type=client_credentials',
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Auth failed (${resp.status}): ${txt}`);
    }
    const data = await resp.json();
    this._token       = data.access_token;
    this._tokenExpiry = Date.now() + data.expires_in * 1000 - 30_000;
    return this._token;
  }

  async _refreshUserToken(refreshToken) {
    if (!this.hasCredentials()) throw new Error('No credentials for refresh.');
    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:  'Basic ' + _basicAuth(this.clientId, this.clientSecret),
      },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!resp.ok) throw new Error('Refresh failed');
    _storeUserToken(await resp.json());
  }

  // --- GraphQL ---

  async query(gql, variables = {}) {
    const token    = await this._fetchToken();
    const endpoint = this.isLoggedIn() ? GQL_USER_ENDPOINT : GQL_CLIENT_ENDPOINT;
    const resp     = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ query: gql, variables }),
    });
    if (!resp.ok) throw new Error(`GQL request failed: ${resp.status}`);
    const result = await resp.json();
    if (result.errors?.length) throw new Error(result.errors[0].message);
    return result.data;
  }

  // Fetch the logged-in user's name
  async getCurrentUser() {
    const data = await this.query(`query { userData { currentUser { name id } } }`);
    return data?.userData?.currentUser ?? null;
  }

  // --- high-level helpers ---

  async getReport(code)                          { return this.query(QUERY_REPORT, { code }); }
  async getFightTable(code, fightId, dataType)   { return this.query(QUERY_TABLE,  { code, fightId, dataType }); }
  async getFightGraph(code, fightId, dataType)   { return this.query(QUERY_GRAPH,  { code, fightId, dataType }); }

  async getFightEvents(code, fightId, dataType, startTime, endTime) {
    const events = [];
    let next = null;
    do {
      const vars = { code, fightId, dataType, startTime: next ?? startTime, endTime };
      const data = await this.query(QUERY_EVENTS, vars);
      const block = data.reportData.report.events;
      events.push(...(block.data ?? []));
      next = block.nextPageTimestamp ?? null;
    } while (next && next < endTime);
    return events;
  }

  async getCasts(code, fightId, s, e)      { return this.getFightEvents(code, fightId, 'Casts',      s, e); }
  async getDeaths(code, fightId, s, e)     { return this.getFightEvents(code, fightId, 'Deaths',     s, e); }
  async getInterrupts(code, fightId, s, e) { return this.getFightEvents(code, fightId, 'Interrupts', s, e); }
  async getDispels(code, fightId, s, e)    { return this.getFightEvents(code, fightId, 'Dispels',    s, e); }
}

// --- module-level helpers ---

function _basicAuth(id, secret) {
  return btoa(unescape(encodeURIComponent(`${id}:${secret}`)));
}

function _storeUserToken(data) {
  localStorage.setItem('wcl_access_token',  data.access_token);
  localStorage.setItem('wcl_token_expiry',  String(Date.now() + data.expires_in * 1000 - 30_000));
  if (data.refresh_token) localStorage.setItem('wcl_refresh_token', data.refresh_token);
}

// --- GraphQL queries ---

const QUERY_REPORT = `
query GetReport($code: String!) {
  reportData {
    report(code: $code) {
      title startTime endTime
      zone { id name }
      region { name }
      guild { name }
      fights {
        id name difficulty size kill
        startTime endTime
        friendlyPlayers
        bossPercentage fightPercentage
        gameZone { id name }
        averageItemLevel
      }
      masterData {
        actors(type: "Player") { id name type subType server }
      }
    }
  }
}`;

const QUERY_TABLE = `
query GetTable($code: String!, $fightId: Int!, $dataType: TableDataType!) {
  reportData {
    report(code: $code) {
      table(fightIDs: [$fightId], dataType: $dataType, hostilityType: Friendlies)
    }
  }
}`;

const QUERY_GRAPH = `
query GetGraph($code: String!, $fightId: Int!, $dataType: GraphDataType!) {
  reportData {
    report(code: $code) {
      graph(fightIDs: [$fightId], dataType: $dataType, hostilityType: Friendlies)
    }
  }
}`;

const QUERY_EVENTS = `
query GetEvents($code: String!, $fightId: Int!, $dataType: EventDataType!, $startTime: Float!, $endTime: Float!) {
  reportData {
    report(code: $code) {
      events(fightIDs: [$fightId], dataType: $dataType, startTime: $startTime, endTime: $endTime, limit: 10000) {
        data
        nextPageTimestamp
      }
    }
  }
}`;

export const wcl = new WCLClient();

export function extractReportCode(input) {
  input = input.trim();
  const urlMatch = input.match(/reports\/([A-Za-z0-9]{16})/);
  if (urlMatch) return { code: urlMatch[1], fightId: extractFightId(input) };
  if (/^[A-Za-z0-9]{16}$/.test(input)) return { code: input, fightId: null };
  throw new Error('Invalid report URL or code. Expected a 16-character report ID.');
}

function extractFightId(url) {
  const m = url.match(/[#&]fight=(\d+)/);
  return m ? parseInt(m[1]) : null;
}
