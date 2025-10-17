import type { TimelineProvider } from "../timeline-data";

export const foxtelanalogue: TimelineProvider = {
  category: "Subscription",
  country: "Australia",
  data: {
    axis: {
      end: 2007,
      start: 1995,
      unit: "year",
    },
    // Grouped by channel number
    channels: {
      "1": [
        {
          channel_genre: "Kids",
          channel_name: "Nickelodeon & Nick @ Nite",
          channel_notes: "Kids programming with evening block",
          from: 1995.1,
          to: 1998.11,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "TV1",
          from: 1998.11,
          to: 2007,
        },
      ],
      "2": [
        {
          channel_genre: "FTA",
          channel_name: "ABC Television",
          from: 1995.1,
          to: 2007.12,
        },
      ],
      "3": [
        { channel_genre: "Movies", channel_name: "Showtime", from: 1995.1 },
      ],
      "4": [
        {
          channel_genre: "Movies",
          channel_name: "Encore",
          from: 1995.1,
          to: 1998.11,
        },
        {
          channel_genre: "Shared",
          channel_name: "Nickelodeon & Nick @ Nite",
          from: 1998.11,
          to: 2000.8,
        },
        {
          channel_name: "Nickelodeon",
          channel_notes: "Nick @ Nite programming block stopped",
          from: 2000.8,
          to: 2001,
        },
        {
          channel_genre: "Movies",
          channel_name: "Encore",
          from: 2001,
          to: 2004.3,
        },
        {
          channel_genre: "Movies",
          channel_name: "Showtime Greats",
          channel_notes: "Encore becomes Showtime Greats",
          from: 2004.3,
          to: 2007,
        },
      ],
      "5": [
        { channel_name: "UK.TV", from: 1996.8, to: 2000.12 },
        {
          channel_genre: "Kids",
          channel_name: "Nickelodeon",
          from: 2000.12,
          to: 2007,
        },
      ],
      "6": [
        { channel_name: "Discovery Channel", from: 1995.1, to: 2000.12 },
        {
          channel_genre: "Shared",
          channel_name: "Fox Kids & Fox Classics",
          from: 2000.12,
          to: 2004.2,
        },
        {
          channel_genre: "Movies",
          channel_name: "Fox Classics",
          channel_notes: "Channel split into Fox Kids and Fox Classics",
          from: 2004.2,
          to: 2007,
        },
      ],
      "7": [
        {
          channel_genre: "FTA",
          channel_name: "Channel Seven",
          from: 1995.1,
          to: 2007.12,
        },
      ],
      "8": [
        {
          channel_genre: "Shared",
          channel_name: "Fox / Fox Kids",
          from: 1995.1,
          to: 1997.4,
        },
        {
          channel_genre: "Shared",
          channel_name: "FOX8 / Fox Kids",
          from: 1997.4,
          to: 1998.11,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "FOX8",
          channel_notes:
            "Channel split, Fox Kids programming moves to share with Fox Classics",
          from: 1998.11,
          to: 2007,
        },
      ],
      "9": [
        {
          channel_genre: "FTA",
          channel_name: "Channel Nine",
          from: 1995.1,
          to: 2007.12,
        },
      ],
      "10": [
        {
          channel_genre: "FTA",
          channel_name: "Channel Ten",
          from: 1995.1,
          to: 2007.12,
        },
      ],
      "11": [
        {
          channel_genre: "Sports",
          channel_name: "Premier Sports Network",
          from: 1995.1,
          to: 1996.3,
        },
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports",
          from: 1996.3,
          to: 2007,
        },
      ],
      "12": [
        {
          channel_genre: "News",
          channel_name: "Sky News Australia",
          from: 1996.2,
          to: 1997.9,
        },
        {
          channel_name: "National Geographic Channel",
          from: 1997.9,
          to: 2000.12,
        },
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports 2",
          from: 2000.12,
          to: 2007,
        },
      ],
      "13": [
        {
          channel_genre: "Music",
          channel_name: "Red",
          from: 1995.1,
          to: 1997.4,
        },
        {
          channel_genre: "Music",
          channel_name: "Channel [V]",
          from: 1997.4,
          to: 2000.12,
        },
        { channel_name: "Foxtel EPG", from: 2000.12, to: 2007 },
      ],
      "14": [
        {
          channel_genre: "Entertainment",
          channel_name: "Arena",
          from: 1995.1,
          to: 2000,
        },
        {
          channel_genre: "News",
          channel_name: "Sky News Australia",
          from: 2000,
          to: 2001.12,
        },
        {
          channel_genre: "Sports",
          channel_name: "Fox Footy Channel",
          from: 2002.3,
          to: 2006,
        },
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports 3",
          from: 2006,
          to: 2007,
        },
      ],
      "15": [
        { channel_name: "TV1", from: 1995.1, to: 1998.11 },
        {
          channel_genre: "Movies",
          channel_name: "Encore",
          from: 1998,
          to: 2000.12,
        },
        {
          channel_genre: "Music",
          channel_name: "Channel [V]",
          from: 2000.12,
          to: 2002.9,
        },
        {
          channel_genre: "Sports",
          channel_name: "ESPN",
          from: 2002.9,
          to: 2003.12,
        },
        { channel_name: "Animal Planet", from: 2003.12, to: 2007 },
      ],
      "16": [
        {
          channel_genre: "News",
          channel_name: "BBC World",
          from: 1995.1,
          to: 1997.9,
        },
        {
          channel_genre: "News",
          channel_name: "Sky News Australia",
          from: 1997.9,
          to: 2000.12,
        },
        {
          channel_genre: "Music",
          channel_name: "MusicMax",
          from: 2000.12,
          to: 2002.9,
        },
        {
          channel_genre: "Music",
          channel_name: "Channel [V]",
          from: 2002.9,
          to: 2003.12,
        },
        {
          channel_genre: "Sports",
          channel_name: "ESPN",
          from: 2003.12,
          to: 2007,
        },
      ],
      "17": [
        { channel_name: "TNT", from: 1995.1, to: 1997.9 },
        { channel_name: "BBC World", from: 1997.9, to: 2000.12 },
        {
          channel_genre: "Music",
          channel_name: "MusicCountry",
          from: 2000.12,
          to: 2002.9,
        },
        {
          channel_genre: "Music",
          channel_name: "MusicMax",
          from: 2002.9,
          to: 2003.12,
        },
        {
          channel_genre: "Documentary",
          channel_name: "The History Channel",
          from: 2003.12,
          to: 2007,
        },
      ],
      "18": [
        { channel_name: "CNN International", from: 1995.1, to: 2000.12 },
        {
          channel_name: "National Geographic Channel",
          from: 2000.12,
          to: 2007,
        },
      ],
      "19": [
        {
          channel_name: "Country Music Television",
          from: 1995.1,
          to: 1997.9,
        },
        { channel_name: "The LifeStyle Channel", from: 1997.9, to: 2000.12 },
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Channel",
          from: 2000.12,
          to: 2007,
        },
      ],
      "20": [
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 1995.1,
          to: 1997.9,
        },
        { channel_name: "TNT", from: 1997.9, to: 2000.7 },
        { channel_name: "TCM", from: 2000.7, to: 2001 },
        {
          channel_genre: "Entertainment",
          channel_name: "UK.TV",
          from: 2001,
          to: 2007,
        },
      ],
      "21": [
        {
          channel_genre: "Movies",
          channel_name: "World Movies",
          from: 1995.1,
          to: 1996.8,
        },
        {
          channel_genre: "News",
          channel_name: "Asia Business News",
          from: 1996.8,
          to: 1997.9,
        },
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 1997.9,
          to: 2000.12,
        },
        {
          channel_genre: "Lifestyle",
          channel_name: "The LifeStyle Channel",
          from: 2000.12,
          to: 2007,
        },
      ],
      "22": [
        {
          channel_genre: "News",
          channel_name: "Asia Business News",
          from: 1995.1,
          to: 1996.8,
        },
        { channel_name: "SBS", from: 1996.8, to: 1997.9 },
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports Two / Fox News",
          from: 1997.9,
          to: 1999.8,
        },
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports Two",
          from: 1999.8,
          to: 2000.12,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "Arena",
          from: 2000.12,
          to: 2007,
        },
      ],
      "23": [
        { channel_name: "SBS", from: 1995.1, to: 1996.8 },
        { channel_name: "Bloomberg", from: 1996.8, to: 1997.9 },
        {
          channel_genre: "Music",
          channel_name: "Country Music Television",
          from: 1997.9,
          to: 1999.8,
        },
        {
          channel_genre: "Sports",
          channel_name: "Sky Racing",
          from: 1999.8,
          to: 2000.12,
        },
        { channel_name: "FX", from: 2000.12, to: 2003.11 },
        {
          channel_genre: "Entertainment",
          channel_name: "W",
          from: 2003.11,
          to: 2007,
        },
      ],
      "24": [
        {
          channel_genre: "News",
          channel_name: "Bloomberg",
          from: 1995.1,
          to: 1996.8,
        },
        {
          channel_genre: "News",
          channel_name: "Foxtel Weather",
          from: 1996.8,
          to: 1997.9,
        },
        {
          channel_genre: "News",
          channel_name: "Asia Business News",
          from: 1997.9,
          to: 1998.2,
        },
        {
          channel_genre: "News",
          channel_name: "CNBC",
          from: 1998.2,
          to: 1999.8,
        },
        {
          channel_genre: "Music",
          channel_name: "Country Music Television",
          from: 1999.8,
          to: 2000.11,
        },
        {
          channel_genre: "Music",
          channel_name: "MusicCountry",
          from: 2000.11,
          to: 2001,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "Hallmark Entertainment Network",
          from: 2001,
          to: 2007,
        },
      ],
      "25": [
        { channel_name: "Foxtel Weather", from: 1995.1, to: 1996.8 },
        { channel_name: "World Movies", from: 1996.8, to: 1997.9 },
        { channel_name: "Bloomberg", from: 1997.9, to: 2000.12 },
        {
          channel_genre: "Documentary",
          channel_name: "The History Channel",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "The Comedy Channel",
          from: 2001.12,
          to: 2007,
        },
      ],
      "26": [
        {
          channel_genre: "Entertainment",
          channel_name: "The Comedy Channel",
          from: 1996.8,
          to: 1997.9,
        },
        {
          channel_genre: "News",
          channel_name: "Foxtel Weather",
          from: 1996.8,
          to: 1999.8,
        },
        {
          channel_genre: "News",
          channel_name: "CNBC",
          from: 1999.8,
          to: 2000.12,
        },
        {
          channel_genre: "Entertainment",
          channel_name: "The Comedy Channel",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "Documentary",
          channel_name: "The History Channel",
          from: 2001.12,
          to: 2003,
        },
        { channel_name: "Ovation", from: 2003, to: 2007 },
      ],
      "27": [
        {
          channel_name: "Hallmark Entertainment Network",
          from: 1996.8,
          to: 1997.9,
        },
        { channel_name: "Foxtel EPG", from: 1997.9, to: 1999.8 },
        { channel_name: "TVSN", from: 1999.8, to: 2000.12 },
        {
          channel_genre: "Movies",
          channel_name: "TCM",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "Kids",
          channel_name: "The Disney Channel",
          from: 2001.12,
          to: 2007,
        },
      ],
      "28": [
        { channel_name: "fx / FXM", from: 1995.1, to: 1997.9 },
        { channel_name: "SBS", from: 1997.9, to: 2001.12 },
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 2001.12,
          to: 2007,
        },
      ],
      "29": [
        {
          channel_name: "Fox Soap / Talk / Travel / History",
          from: 1996.8,
          to: 1997.9,
        },
        { channel_name: "TVSN", from: 1997.9, to: 1999.8 },
        { channel_name: "Foxtel Weather", from: 1999.8, to: 2000.12 },
        {
          channel_genre: "Movies",
          channel_name: "Movie One",
          from: 2002.12,
          to: 2007,
        },
      ],
      "30": [
        { channel_name: "TVSN", from: 1995.12, to: 1997.9 },
        {
          channel_name: "Hallmark Entertainment Network",
          from: 1997.9,
          to: 1999.8,
        },
        {
          channel_genre: "Movies",
          channel_name: "Movie Extra",
          from: 2002.12,
          to: 2007,
        },
      ],
      "31": [
        { channel_name: "Foxtel EPG", from: 1995.1, to: 1997.9 },
        {
          channel_name: "Fox Soap / Talk / Travel / History",
          from: 1997.9,
          to: 1998.11,
        },
        {
          channel_name: "Fox Kids / The History Channel",
          from: 1998.11,
          to: 2000.12,
        },
        {
          channel_genre: "Kids",
          channel_name: "Cartoon Network",
          from: 2000.12,
          to: 2001,
        },
        {
          channel_genre: "Movies",
          channel_name: "Movie Greats",
          from: 2002.12,
          to: 2007,
        },
      ],
      "32": [
        {
          channel_name: "fx / FXM: Movies From Fox",
          from: 1997.9,
          to: 1998.11,
        },
        { channel_name: "fx / FX Movies", from: 1998.11, to: 2000.12 },
        { channel_name: "Fashion TV", from: 2000.12, to: 2001.12 },
        {
          channel_genre: "Movies",
          channel_name: "TCM",
          from: 2001.12,
          to: 2007,
        },
      ],
      "33": [
        { channel_name: "The Comedy Channel", from: 1997.9, to: 2000.12 },
        {
          channel_genre: "Movies",
          channel_name: "Showtime 2",
          from: 2000.12,
          to: 2007,
        },
      ],
      "34": [
        { channel_name: "World Movies", from: 1997.9, to: 1999.8 },
        {
          channel_name: "Hallmark Entertainment Network",
          from: 1999.8,
          to: 2000.12,
        },
        {
          channel_genre: "News",
          channel_name: "Fox News Channel",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "Sky News Australia",
          from: 2001.12,
          to: 2007,
        },
      ],
      "35": [
        { channel_name: "Event TV", from: 1997.9, to: 1999.8 },
        {
          channel_genre: "Movies",
          channel_name: "World Movies",
          from: 1999.8,
          to: 2000.12,
        },
        {
          channel_genre: "News",
          channel_name: "CNN International",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "Fox News Channel",
          from: 2001.12,
          to: 2007,
        },
      ],
      "36": [
        { channel_name: "Antenna Pacific", from: 1998.9, to: 2000.12 },
        {
          channel_genre: "News",
          channel_name: "BBC World",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "CNN International",
          from: 2001.12,
          to: 2007,
        },
      ],
      "37": [
        { channel_name: "Rai Internazionale", from: 1998.9, to: 2000.12 },
        {
          channel_genre: "News",
          channel_name: "CNBC",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "BBC World",
          from: 2001.12,
          to: 2007,
        },
      ],
      "38": [
        { channel_name: "Sky Racing", from: 1998.9, to: 1999 },
        { channel_name: "Main Event", from: 1999, to: 2000.12 },
        {
          channel_genre: "News",
          channel_name: "Bloomberg",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "CNBC",
          from: 2001.12,
          to: 2007,
        },
      ],
      "39": [
        {
          channel_genre: "News",
          channel_name: "Fox News Channel",
          from: 1999.8,
          to: 2000.12,
        },
        {
          channel_genre: "News",
          channel_name: "Foxtel Weather",
          from: 2000.12,
          to: 2001.12,
        },
        {
          channel_genre: "News",
          channel_name: "Bloomberg",
          from: 2001.12,
          to: 2007,
        },
      ],
      "40": [
        {
          channel_genre: "Sports",
          channel_name: "Sky Racing",
          from: 2000.12,
          to: 2003.12,
        },
        {
          channel_genre: "News",
          channel_name: "The Weather Channel",
          from: 2003.12,
          to: 2007,
        },
      ],
      "41": [
        { channel_name: "TVSN", from: 2000.12, to: 2001.12 },
        { channel_name: "SBS", from: 2001.12, to: 2007 },
      ],
      "42": [
        {
          channel_genre: "Movies",
          channel_name: "World Movies",
          from: 2000.12,
          to: 2007,
        },
      ],
      "43": [
        { channel_name: "Antenna Pacific", from: 2000.12, to: 2002.12 },
        { channel_name: "Ovation", from: 2002.12, to: 2003.12 },
        {
          channel_genre: "Music",
          channel_name: "Channel [V]",
          from: 2003.12,
          to: 2007,
        },
      ],
      "44:": [
        { channel_name: "Main Event", from: 2000.12, to: 2002 },
        { channel_name: "Main Event / Adults Only", from: 2002, to: 2003.12 },
        {
          channel_genre: "Music",
          channel_name: "Music Max",
          from: 2003.12,
          to: 2004.6,
        },
        {
          channel_genre: "Music",
          channel_name: "Music Max",
          from: 2004.6,
          to: 2007,
        },
      ],
      "45": [
        { channel_name: "RAI Internazionale", from: 2000.12, to: 2002.12 },
        { channel_name: "MTV", from: 2002.12, to: 2007 },
      ],
      "46": [
        { channel_name: "Adults Only", from: 2001, to: 2002.12 },
        { channel_name: "Antenna Pacific", from: 2002.12, to: 2003.12 },
        {
          channel_name: "Main Event / Adults Only / Fashion TV",
          from: 2003.12,
          to: 2007,
        },
      ],
      "49": [
        { channel_name: "nightmoves", from: 1997, to: 1998 },
        { channel_name: "Adults Only", from: 1998, to: 2001.12 },
        { channel_name: "TVSN", from: 2001.12, to: 2007 },
      ],
      "50": [
        { channel_name: "Foxtel Weather", from: 2001, to: 2002.12 },
        { channel_name: "MTV", from: 2002.12, to: 2003.12 },
        { channel_name: "Sky Racing", from: 2003.12, to: 2007 },
      ],
      "51": [{ channel_name: "RAI Internazionale", from: 2003, to: 2007 }],
      "52": [
        {
          channel_genre: "News",
          channel_name: "Foxtel Weather",
          from: 2002.12,
          to: 2003.12,
        },
        { channel_name: "Antenna Pacific (Greek)", from: 2003.12, to: 2007 },
      ],
    },
    description: "Timeline of channel changes from 1995 to 2007",
    events: [
      {
        label: "Foxtel Launches",
        note: "Foxtel launches on 23rd October 1995",
        type: "Launch",
        when: 1995.1,
      },
      {
        label: "Proposed Merger with Galaxy",
        note: "Foxtel proposes to merge with Galaxy, but is rejected by the ACCC on competition grounds",
        type: "News",
        when: 1997,
      },
      {
        label: "PBL Invests",
        note: "The Packers via PBL purchase a 25% stake (from News Corp)",
        type: "Launch",
        when: 1998,
      },
      {
        label: "Galaxy Collapses",
        note: "Competitor Galaxy ceases operations, Foxtel acquires subscribers",
        type: "Change",
        when: 1998.5,
      },
      {
        label: "Satellite Service",
        note: "Foxtel launches satellite service",
        type: "Launch",
        when: 1999.2,
      },
      {
        label: "Content Sharing Deal",
        note: "Foxtel and Optus gain approval to share content",
        type: "Launch",
        when: 2002.12,
      },
      {
        label: "Foxtel Digital Launches",
        note: "Foxtel Digital launches",
        type: "Launch",
        when: 2004.3,
      },
    ],
    title: "Foxtel Channel History (1995-2007)",
  },
  description: "Foxtel's Analogue Cable Service - 1995 to 2007",
  id: "foxtelanalogue",
  name: "Foxtel (Analogue)",
};
