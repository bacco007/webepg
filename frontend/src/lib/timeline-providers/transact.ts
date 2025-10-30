import type { TimelineProvider } from "../timeline-data";

export const transact: TimelineProvider = {
  category: "Subscription",
  country: "Australia",
  data: {
    axis: {
      end: 2017,
      start: 2002,
      unit: "year",
    },
    channels: {
      "1": [
        {
          channel_genre: "Information",
          channel_name: "TransACT Information",
          from: 2008,
        },
      ],
      "2": [{ channel_genre: "FTA", channel_name: "ABC", from: 2002 }],
      "3": [
        {
          channel_genre: "FTA",
          channel_name: "ABC Kids",
          from: 2002,
          to: 2003,
        },
        { channel_genre: "FTA", channel_name: "SBS", from: 2005 },
      ],
      "4": [
        {
          channel_genre: "Information",
          channel_name: "TransACT Promo Channel",
          from: 2002,
        },
      ],
      "5": [
        {
          channel_genre: "FTA",
          channel_name: "ABC Fly TV",
          from: 2002,
          to: 2003,
        },
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 2005,
          to: 2008,
        },
        {
          channel_genre: "FTA",
          channel_name: "Southern Cross Ten",
          from: 2008,
        },
      ],
      "6": [
        {
          channel_genre: "Kids",
          channel_name: "Disney Channel",
          from: 2002,
          to: 2008,
        },
        { channel_genre: "FTA", channel_name: "Prime7", from: 2008 },
      ],
      "7": [
        { channel_genre: "FTA", channel_name: "Prime7", from: 2002, to: 2008 },
      ],
      "8": [
        { channel_genre: "FTA", channel_name: "SBS", from: 2002, to: 2005 },
        { channel_genre: "FTA", channel_name: "WIN Television", from: 2008 },
      ],
      "9": [
        {
          channel_genre: "FTA",
          channel_name: "WIN Television",
          from: 2002,
          to: 2008,
        },
      ],
      "10": [
        {
          channel_genre: "FTA",
          channel_name: "Southern Cross Ten",
          from: 2002,
          to: 2008,
        },
      ],
      "11": [
        {
          channel_genre: "News",
          channel_name: "Federal Parliament - House of Representatives",
          from: 2002,
          to: 2005,
        },
        {
          channel_genre: "News",
          channel_name: "CNN International",
          from: 2005,
          to: 2008,
        },
      ],
      "12": [
        {
          channel_genre: "News",
          channel_name: "Federal Parliament - Senate",
          from: 2002,
          to: 2005,
        },
        {
          channel_genre: "News",
          channel_name: "BBC World News",
          from: 2005,
          to: 2008,
        },
      ],
      "13": [
        {
          channel_genre: "News",
          channel_name: "CNBC Australia",
          from: 2005,
          to: 2008,
        },
      ],
      "14": [
        {
          channel_genre: "News",
          channel_name: "BBC World",
          from: 2002,
          to: 2005,
        },
        {
          channel_genre: "News",
          channel_name: "Bloomberg Television",
          from: 2005,
          to: 2008,
        },
      ],
      "15": [
        {
          channel_genre: "Movies",
          channel_name: "Turner Classic Movies",
          from: 2005,
          to: 2008,
        },
      ],
      "16": [
        { channel_genre: "News", channel_name: "CNBC", from: 2002, to: 2005 },
        {
          channel_genre: "International",
          channel_name: "Deutsche Welle (German)",
          from: 2005,
          to: 2008,
        },
      ],
      "18": [
        {
          channel_genre: "International",
          channel_name: "Liaoning TV (Chinese)",
          from: 2002,
          to: 2008,
        },
      ],
      "19": [
        {
          channel_genre: "International",
          channel_name: "TV5Monde (French)",
          from: 2002,
          to: 2008,
        },
      ],
      "20": [
        {
          channel_genre: "International",
          channel_name: "Deutsche Welle (German)",
          from: 2002,
          to: 2005,
        },
      ],
      "22": [{ channel_genre: "FTA", channel_name: "ABC2", from: 2005 }],
      "23": [
        { channel_genre: "Sports", channel_name: "ESPN", from: 2005, to: 2008 },
        { channel_genre: "FTA", channel_name: "ABC3", from: 2010 },
      ],
      "24": [
        {
          channel_genre: "Sports",
          channel_name: "Fox Footy Channel",
          from: 2005,
          to: 2006,
        },
        { channel_genre: "FTA", channel_name: "ABC News 24 HD", from: 2011 },
      ],
      "25": [
        {
          channel_genre: "News",
          channel_name: "Channel NewsAsia",
          from: 2005.1,
          to: 2008,
        },
      ],
      "26": [
        {
          channel_genre: "Kids",
          channel_name: "Boomerang",
          from: 2005,
          to: 2008,
        },
      ],
      "27": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Real Time",
          from: 2005,
          to: 2008,
        },
      ],
      "28": [
        {
          channel_genre: "Documentary",
          channel_name: "Animal Planet",
          from: 2005,
          to: 2008,
        },
      ],
      "29": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Travel and Living",
          from: 2005,
          to: 2008,
        },
      ],
      "30": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Science",
          from: 2005,
          to: 2008,
        },
        { channel_genre: "FTA", channel_name: "SBS One HD", from: 2008 },
      ],
      "31": [
        {
          channel_genre: "FTA",
          channel_name: "SBS World News Channel",
          from: 2008,
        },
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Home and Health",
          from: 2005,
          to: 2008,
        },
      ],
      "32": [
        {
          channel_genre: "Documentary",
          channel_name: "National Geographic Channel",
          from: 2005,
          to: 2008,
        },
        { channel_genre: "FTA", channel_name: "SBS Two", from: 2009 },
      ],
      "33": [
        {
          channel_genre: "Documentary",
          channel_name: "Adventure One",
          from: 2005,
          to: 2008,
        },
      ],
      "38": [
        {
          channel_genre: "Entertainment",
          channel_name: "Fashion TV",
          from: 2005,
          to: 2008,
        },
      ],
      "39": [
        {
          channel_genre: "Entertainment",
          channel_name: "E!",
          from: 2005,
          to: 2008,
        },
      ],
      "41": [
        {
          channel_genre: "News",
          channel_name: "CNN International",
          from: 2002,
          to: 2005,
        },
      ],
      "42": [
        {
          channel_genre: "News",
          channel_name: "CNNfn",
          from: 2002,
          to: 2005,
        },
        {
          channel_genre: "Religious",
          channel_name: "Australian Christian Channel",
          from: 2005,
          to: 2008,
        },
      ],
      "43": [
        { channel_genre: "Sports", channel_name: "ESPN", from: 2002, to: 2005 },
      ],
      "44": [
        {
          channel_genre: "Movies",
          channel_name: "Turner Classic Movies",
          from: 2002,
          to: 2005,
        },
      ],
      "45": [
        {
          channel_genre: "Music",
          channel_name: "Soundtrack Channel",
          from: 2002,
          to: 2005,
        },
      ],
      "46": [
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 2002,
          to: 2005,
        },
      ],
      // —— Existing 2011+ entries that remain unchanged ——
      "50": [{ channel_genre: "FTA", channel_name: "One HD", from: 2008 }],
      "55": [{ channel_genre: "FTA", channel_name: "Eleven", from: 2011 }],
      "62": [{ channel_genre: "FTA", channel_name: "7Two", from: 2010 }],
      "63": [{ channel_genre: "FTA", channel_name: "7mate HD", from: 2011 }],
      "80": [{ channel_genre: "FTA", channel_name: "GEM HD", from: 2011 }],
      "88": [{ channel_genre: "FTA", channel_name: "GO!", from: 2009 }],
      "201": [
        { channel_genre: "Kids", channel_name: "Disney Channel", from: 2008 },
      ],
      "202": [
        {
          channel_genre: "Kids",
          channel_name: "Playhouse Disney",
          from: 2007.11,
        },
      ],
      "203": [
        { channel_genre: "Kids", channel_name: "Cartoon Network", from: 2008 },
      ],
      "204": [{ channel_genre: "Kids", channel_name: "Boomerang", from: 2008 }],
      "251": [{ channel_genre: "Music", channel_name: "MTV", from: 2008 }],
      "252": [
        { channel_genre: "Music", channel_name: "VH1", from: 2008, to: 2011 },
        { channel_genre: "Music", channel_name: "MTV Classic", from: 2011 },
      ],
      "253": [
        { channel_genre: "Entertainment", channel_name: "E!", from: 2008 },
      ],
      "254": [
        {
          channel_genre: "Entertainment",
          channel_name: "Fashion TV",
          from: 2008,
        },
      ],
      "255": [
        {
          channel_genre: "Music",
          channel_name: "MCM TOP",
          from: 2008,
          to: 2013,
        },
      ],
      "301": [
        {
          channel_genre: "Documentary",
          channel_name: "National Geographic Channel",
          from: 2008,
        },
      ],
      "302": [
        {
          channel_genre: "Documentary",
          channel_name: "Nat Geo Adventure",
          from: 2008,
          to: 2014,
        },
        {
          channel_genre: "Documentary",
          channel_name: "Nat Geo People",
          from: 2014,
        },
      ],
      "306": [
        {
          channel_genre: "Documentary",
          channel_name: "Animal Planet",
          from: 2008,
        },
      ],
      "307": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Turbo",
          from: 2008,
        },
      ],
      "308": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Travel and Living",
          from: 2008,
          to: 2011,
        },
        { channel_genre: "Documentary", channel_name: "TLC", from: 2011 },
      ],
      "309": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Home and Health",
          from: 2008,
        },
      ],
      "310": [
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Science",
          from: 2008,
        },
      ],
      "351": [{ channel_genre: "Sports", channel_name: "ESPN", from: 2008 }],
      "354": [
        { channel_genre: "Sports", channel_name: "Eurosport", from: 2008 },
      ],
      "355": [
        { channel_genre: "Sports", channel_name: "Eurosportnews", from: 2008 },
      ],
      "356": [
        {
          channel_genre: "Sports",
          channel_name: "Setanta Sports",
          from: 2009,
          to: 2014,
        },
        { channel_genre: "Sports", channel_name: "beIN Sports", from: 2014 },
      ],
      "411": [
        {
          channel_genre: "Movies",
          channel_name: "Movie One",
          from: 2008.6,
          to: 2012.12,
        },
      ],
      "412": [
        {
          channel_genre: "Movies",
          channel_name: "Movie Two",
          from: 2008.6,
          to: 2012.12,
        },
      ],
      "413": [
        {
          channel_genre: "Movies",
          channel_name: "Movie Extra",
          from: 2008.6,
          to: 2012.12,
        },
      ],
      "415": [
        {
          channel_genre: "Movies",
          channel_name: "Movie Greats",
          from: 2008.6,
          to: 2012.12,
        },
      ],
      "417": [
        {
          channel_genre: "Movies",
          channel_name: "Turner Classic Movies",
          from: 2008,
        },
      ],
      "451": [
        {
          channel_genre: "News",
          channel_name: "CNN International",
          from: 2008,
        },
      ],
      "452": [
        { channel_genre: "News", channel_name: "BBC World News", from: 2008 },
      ],
      "453": [
        { channel_genre: "News", channel_name: "CNBC Australia", from: 2008 },
      ],
      "454": [
        {
          channel_genre: "News",
          channel_name: "Bloomberg Television",
          from: 2008,
        },
      ],
      "455": [
        { channel_genre: "News", channel_name: "Channel NewsAsia", from: 2008 },
      ],
      "458": [{ channel_genre: "News", channel_name: "euronews", from: 2008 }],
      "459": [{ channel_genre: "News", channel_name: "CCTV9", from: 2008 }],
      "460": [
        {
          channel_genre: "News",
          channel_name: "Al Jazeera English",
          from: 2008,
        },
      ],
      "461": [
        {
          channel_genre: "News",
          channel_name: "euronews (Italian)",
          from: 2008,
        },
      ],
      "462": [
        {
          channel_genre: "News",
          channel_name: "euronews (Spanish)",
          from: 2008,
        },
      ],
      "463": [{ channel_genre: "News", channel_name: "CCTV4", from: 2008 }],
      "501": [
        { channel_genre: "Other", channel_name: "Channelvision", from: 2008 },
      ],
      "502": [{ channel_genre: "Other", channel_name: "NITV", from: 2009 }],
      "510": [
        {
          channel_genre: "News",
          channel_name: "Federal Parliament - House of Representatives",
          from: 2008,
        },
      ],
      "511": [
        {
          channel_genre: "News",
          channel_name: "Federal Parliament - Senate",
          from: 2008,
        },
      ],
      "512": [
        {
          channel_genre: "News",
          channel_name: "Federal Parliament - Parliamentary Committees",
          from: 2008,
        },
      ],
      "551": [{ channel_genre: "Religious", channel_name: "EWTN", from: 2008 }],
      "552": [
        {
          channel_genre: "Religious",
          channel_name: "Australian Christian Channel",
          from: 2008,
        },
      ],
      "601": [
        {
          channel_genre: "International",
          channel_name: "ERT World (Greek)",
          from: 2008,
        },
      ],
      "602": [
        {
          channel_genre: "International",
          channel_name: "RTPi (Portuguese)",
          from: 2008,
        },
      ],
      "603": [
        {
          channel_genre: "International",
          channel_name: "TV5Monde (French)",
          from: 2008,
        },
      ],
      "604": [
        {
          channel_genre: "International",
          channel_name: "Deutsche Welle (German)",
          from: 2008,
        },
      ],
    },
    description: "Timeline of channel changes from 1995 to 1998",
    events: [
      {
        label: "iiNet acquires TransACT",
        note: "iiNet acquires TransACT",
        type: "Launch",
        when: "2011.11",
      },
      {
        label: "Transition to Fetch TV",
        note: "Transition to Fetch TV",
        type: "Closure",
        when: "2017",
      },
    ],
    title: "TransACT TransTV Channel History (2001-2017)",
  },
  description: "TransACT's TransTV Service from 2001 to 2017",
  id: "transact",
  name: "TransACT TransTV",
};
