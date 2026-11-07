export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const uid = String(req.query.uid || "").trim();
  const region = String(req.query.region || "BD").toUpperCase();

  const allowedRegions = [
    "BD", "IND", "SG", "ID", "TH", "VN",
    "TW", "BR", "US", "SAC", "NA", "RU",
    "ME", "PK", "CIS", "EUROPE"
  ];

  if (!/^\d{5,15}$/.test(uid)) {
    return res.status(400).json({
      success: false,
      error: "Invalid UID"
    });
  }

  if (!allowedRegions.includes(region)) {
    return res.status(400).json({
      success: false,
      error: "Invalid region"
    });
  }

  try {
    const apiURL =
      "https://api2.nftoken.info/get" +
      `?uid=${encodeURIComponent(uid)}` +
      `&region=${encodeURIComponent(region)}`;

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15000)
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        success: false,
        error: "External API returned invalid JSON",
        upstreamStatus: response.status
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: "External API request failed",
        upstreamStatus: response.status
      });
    }

    if (data.error || !data.AccountInfo) {
      return res.status(404).json({
        success: false,
        error: data.error || "Player information unavailable"
      });
    }

    const a = data.AccountInfo;
    const g = data.GuildInfo || {};

    return res.status(200).json({
      success: true,

      player: {
        uid: uid,
        name: a.AccountName ?? null,
        level: a.AccountLevel ?? null,
        likes: a.AccountLikes ?? null,
        exp: a.AccountEXP ?? null,
        region: a.AccountRegion || region,
        brRank: a.BrMaxRank ?? null,
        brPoints: a.BrRankPoint ?? null,
        csRank: a.CsMaxRank ?? null,
        csPoints: a.CsRankPoint ?? null
      },

      guild: {
        id: g.GuildID ?? null,
        name: g.GuildName || "No Guild",
        level: g.GuildLevel ?? null,
        members: g.GuildMember ?? null,
        owner: g.GuildOwner ?? null
      }
    });

  } catch (error) {
    console.error("FF API Error:", error.message);

    return res.status(502).json({
      success: false,
      error: "Unable to connect to Free Fire API"
    });
  }
      }
