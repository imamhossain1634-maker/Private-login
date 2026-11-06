export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
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
      error: "Invalid Player UID"
    });
  }

  if (!allowedRegions.includes(region)) {
    return res.status(400).json({
      error: "Invalid region"
    });
  }

  try {
    const url =
      `https://api2.nftoken.info/get?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error("Player API unavailable");
    }

    const data = await response.json();

    if (data.error) {
      return res.status(404).json({
        error: data.error
      });
    }

    const account = data.AccountInfo || {};
    const guild = data.GuildInfo || {};

    if (!account.AccountName) {
      return res.status(404).json({
        error: "Player not found"
      });
    }

    return res.status(200).json({
      success: true,
      player: {
        uid: uid,
        name: account.AccountName,
        level: account.AccountLevel,
        likes: account.AccountLikes,
        region: account.AccountRegion || region,
        exp: account.AccountEXP,
        brRank: account.BrMaxRank,
        brPoints: account.BrRankPoint,
        csRank: account.CsMaxRank,
        csPoints: account.CsRankPoint
      },
      guild: {
        id: guild.GuildID || "",
        name: guild.GuildName || "No Guild",
        level: guild.GuildLevel ?? null,
        members: guild.GuildMember ?? null,
        owner: guild.GuildOwner || ""
      }
    });

  } catch (error) {
    console.error("Player API error:", error.message);

    return res.status(502).json({
      error: "Unable to fetch player information. Try again later."
    });
  }
    }
