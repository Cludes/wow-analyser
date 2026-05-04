const GQL_ENDPOINT = 'https://www.warcraftlogs.com/api/v2/client';
const TOKEN_ENDPOINT = 'https://www.warcraftlogs.com/oauth/token';

// How long before expiry we stop trusting the CI token (2h buffer, refresh runs every 20h)
const CI_TOKEN_TTL = 20 * 60 * 60 * 1000;

class WCLClient {
  constructor() {
    this._token = null;
    this._tokenExpiry = 0;
    this._ciChecked = false;
    this._usingCIToken = false;
  }

  get clientId()     { return localStorage.getItem('wcl_client_id') || ''; }
  get clientSecret() { return localStorage.getItem('wcl_client_secret') || ''; }

  setCredentials(id, secret) {
    localStorage.setItem('wcl_client_id', id);
    localStorage.setItem('wcl_client_secret', secret);
    // clear cached token so next request uses manual credentials
    this._token = null;
    this._tokenExpiry = 0;
    this._usingCIToken = false;
  }

  hasCredentials() {
    return !!(this.clientId && this.clientSecret);
  }

  // Returns true if the app is running with a CI-managed token (no manual setup needed)
  get usingCIToken() { return this._usingCIToken; }

  async _fetchToken() {
    if (this._token && Date.now() < this._tokenExpiry) return this._token;

    // Try config.json written by GitHub Actions first
    if (!this._ciChecked) {
      this._ciChecked = true;
      try {
        const resp = await fetch('./config.json', { cache: 'no-cache' });
        if (resp.ok) {
          const cfg = await resp.json();
          if (cfg.token) {
            this._token = cfg.token;
            this._tokenExpiry = Date.now() + CI_TOKEN_TTL;
            this._usingCIToken = true;
            return this._token;
          }
        }
      } catch {
        // config.json not present or invalid - fall through to manual auth
      }
    }

    // Fall back to client credentials entered manually
    if (!this.hasCredentials()) {
      throw new Error('No API credentials. Enter your WarcraftLogs Client ID and Secret, or set up GitHub Actions.');
    }
    const resp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Auth failed (${resp.status}): ${txt}`);
    }
    const data = await resp.json();
    this._token = data.access_token;
    this._tokenExpiry = Date.now() + data.expires_in * 1000 - 30_000;
    this._usingCIToken = false;
    return this._token;
  }

  async query(gql, variables = {}) {
    const token = await this._fetchToken();
    const resp = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: gql, variables }),
    });
    if (!resp.ok) throw new Error(`GQL request failed: ${resp.status}`);
    const result = await resp.json();
    if (result.errors?.length) throw new Error(result.errors[0].message);
    return result.data;
  }

  // --- high-level helpers ---

  async getReport(code) {
    return this.query(QUERY_REPORT, { code });
  }

  async getFightTable(code, fightId, dataType) {
    return this.query(QUERY_TABLE, { code, fightId, dataType });
  }

  async getFightGraph(code, fightId, dataType) {
    return this.query(QUERY_GRAPH, { code, fightId, dataType });
  }

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

  async getCasts(code, fightId, startTime, endTime) {
    return this.getFightEvents(code, fightId, 'Casts', startTime, endTime);
  }

  async getDeaths(code, fightId, startTime, endTime) {
    return this.getFightEvents(code, fightId, 'Deaths', startTime, endTime);
  }
}

const QUERY_REPORT = `
query GetReport($code: String!) {
  reportData {
    report(code: $code) {
      title
      startTime
      endTime
      zone { id name }
      region { name }
      guild { name }
      fights {
        id name difficulty size kill
        startTime endTime
        friendlyPlayers
        bossPercentage fightPercentage
        gameZone { id name }
        lastPhaseForPercentages
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
