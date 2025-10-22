import type { TimelineProvider } from "../timeline-data";

export const freeview_metro: TimelineProvider = {
  category: "Free-to-Air",
  colorBy: "channel_network",
  colorMap: {
    ABC: "bg-blue-200 text-blue-900 border-blue-300 hover:bg-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/60",
    Community:
      "bg-teal-200 text-teal-900 border-teal-300 hover:bg-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-700 dark:hover:bg-teal-900/60",
    Default:
      "bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
    Nine: "bg-indigo-200 text-indigo-900 border-indigo-300 hover:bg-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-700 dark:hover:bg-indigo-900/60",
    SBS: "bg-orange-200 text-orange-900 border-orange-300 hover:bg-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700 dark:hover:bg-orange-900/60",
    Seven:
      "bg-emerald-200 text-emerald-900 border-emerald-300 hover:bg-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-900/60",
    Ten: "bg-purple-200 text-purple-900 border-purple-300 hover:bg-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700 dark:hover:bg-purple-900/60",
  },
  country: "Australia",
  data: {
    axis: {
      end: 2026,
      start: 2001,
      unit: "year",
    },
    channels: {
      "1": [
        {
          channel_genre: "Television",
          channel_name: "10 HD (Breakway Channel)",
          channel_network: "Ten",
          from: 2007.12,
          to: 2009.3,
        },
        {
          channel_genre: "Television",
          channel_name: "One HD",
          channel_network: "Ten",
          from: 2009.3,
          to: 2016.3,
        },
        {
          channel_genre: "Television",
          channel_name: "10 HD",
          channel_network: "Ten",
          from: 2016.3,
        },
      ],
      "2": [
        {
          channel_genre: "Television",
          channel_name: "ABC TV",
          channel_network: "ABC",
          from: 2001.1,
        },
      ],
      "3": [
        {
          channel_genre: "Television",
          channel_name: "SBS",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "4": [
        {
          channel_genre: "Television",
          channel_name: "Channel 4",
          channel_network: "Digital 44 Trial",
          channel_notes: "Video Program Guide",
          from: "2008.10",
          to: "2010.5",
        },
      ],
      "7": [
        {
          channel_genre: "Television",
          channel_name: "Seven Network",
          channel_network: "Seven",
          from: 2001.1,
        },
      ],
      "9": [
        {
          channel_genre: "Television",
          channel_name: "Nine Network",
          channel_network: "Nine",
          from: 2001.1,
        },
      ],
      "10": [
        {
          channel_genre: "Television",
          channel_name: "10",
          channel_network: "Ten",
          from: 2001.1,
        },
      ],
      "11": [
        {
          channel_genre: "Television",
          channel_name: "Ten Guide",
          channel_network: "Ten",
          from: 2004.7,
          to: 2007.11,
        },
        {
          channel_genre: "Television",
          channel_name: "Ten SD2",
          channel_network: "Ten",
          channel_notes: "SD simulcast of Ten HD",
          from: 2007.12,
          to: 2009.3,
        },
        {
          channel_genre: "Television",
          channel_name: "One HD",
          channel_network: "Ten",
          from: 2009.3,
          to: 2010.12,
        },
        {
          channel_genre: "Television",
          channel_name: "Eleven",
          channel_network: "Ten",
          from: 2011.1,
          to: "2018.11",
        },
        {
          channel_genre: "Television",
          channel_name: "10 Peach Comedy",
          channel_network: "Ten",
          from: "2018.11",
          to: 2024.6,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Peach Comedy",
          channel_network: "Ten",
          from: 2024.6,
          to: 2025.6,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Comedy",
          channel_network: "Ten",
          from: 2025.6,
        },
      ],
      "12": [
        {
          channel_genre: "Television",
          channel_name: "One HD",
          channel_network: "Ten",
          from: 2010.12,
          to: 2018.11,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Boss",
          channel_network: "Ten",
          from: 2018.11,
          to: 2018.12,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Bold",
          channel_network: "Ten",
          from: 2018.12,
          to: 2024.6,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Bold Drama",
          channel_network: "Ten",
          from: 2024.6,
          to: 2025.6,
        },
        {
          channel_genre: "Television",
          channel_name: "10 Drama",
          channel_network: "Ten",
          from: 2025.6,
        },
      ],
      "13": [
        {
          channel_genre: "Television",
          channel_name: "10 Shake",
          channel_network: "Ten",
          from: 2020.9,
          to: 2023.8,
        },
        {
          channel_genre: "Television",
          channel_name: "Nickelodeon",
          channel_network: "Ten",
          from: 2023.8,
        },
      ],
      "14": [
        {
          channel_genre: "Television",
          channel_name: "TVSN",
          channel_network: "Ten",
          from: 2012.9,
          to: 2020.9,
        },
        {
          channel_genre: "Television",
          channel_name: "10 HD (Breakway Channel)",
          channel_network: "Ten",
          from: 2007.12,
          to: 2009.3,
        },
      ],
      "15": [
        {
          channel_genre: "Television",
          channel_name: "10 HD",
          channel_network: "Ten",
          from: 2001.1,
        },
      ],
      "16": [
        {
          channel_genre: "Television",
          channel_name: "TVSN",
          channel_network: "Ten",
          from: 2020.9,
          to: 2024.6,
        },
        {
          channel_genre: "Television",
          channel_name: "you.tv",
          channel_network: "Ten",
          from: 2024.7,
        },
      ],
      "17": [
        {
          channel_genre: "Television",
          channel_name: "Gecko",
          channel_network: "Ten",
          from: 2022.9,
        },
        {
          channel_genre: "Television",
          channel_name: "Spree TV",
          channel_network: "Ten",
          channel_notes: "Home Shopping / Infomercial Channel",
          from: 2013.9,
          to: 2022.8,
        },
      ],
      "20": [
        {
          channel_genre: "Television",
          channel_name: "ABC TV HD",
          channel_network: "ABC",
          from: 2001.1,
        },
      ],
      "21": [
        {
          channel_genre: "Television",
          channel_name: "ABC Kids",
          channel_network: "ABC",
          channel_notes: "ABC Kids on-air from: 06:00 to 18:00",
          from: 2001.8,
          to: 2003.11,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Kids / Fly TV",
          channel_network: "ABC",
          channel_notes:
            "ABC Kids on-air from: 06:00 to 18:00, Fly TV on-air from: 18:00 to 06:00",
          from: 2001.11,
          to: 2003.6,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC2",
          channel_network: "ABC",
          from: 2005,
          to: 2008.2,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC TV",
          channel_network: "ABC",
          from: 2001.1,
        },
      ],
      "22": [
        {
          channel_genre: "Television",
          channel_name: "ABC2",
          channel_network: "ABC",
          from: 2008.2,
          to: 2017.12,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Comedy",
          from: 2017.12,
          to: 2021.1,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC TV Plus",
          channel_network: "ABC",
          from: 2021.1,
          to: 2024.6,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Kids / ABC Family",
          channel_network: "ABC",
          channel_notes:
            "ABC Kids on-air from 04:00 to 19:30, ABC Family on-air from 19:30 to 04:00",
          from: 2024.6,
        },
      ],
      "23": [
        {
          channel_genre: "Television",
          channel_name: "ABC3",
          channel_network: "ABC",
          from: 2009.12,
          to: 2016.9,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Me",
          channel_network: "ABC",
          from: 2016.9,
          to: 2024.6,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Entertains",
          channel_network: "ABC",
          from: 2024.6,
          to: 2025.5,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC Entertains HD",
          channel_network: "ABC",
          from: 2025.6,
        },
      ],
      "24": [
        {
          channel_genre: "Television",
          channel_name: "ABC News 24",
          channel_network: "ABC",
          from: 2010.7,
          to: 2016.11,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC News",
          channel_network: "ABC",
          from: 2016.11,
          to: 2025.6,
        },
        {
          channel_genre: "Television",
          channel_name: "ABC News HD",
          channel_network: "ABC",
          from: 2025.6,
        },
      ],
      "25": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Local Radio",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "26": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Radio National",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "27": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Classic FM",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "28": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Triple J",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "29": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Triple J Unearthed",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "30": [
        {
          channel_genre: "Television",
          channel_name: "SBS HD",
          channel_network: "SBS",
          from: 2006.12,
        },
      ],
      "31": [
        {
          channel_genre: "Datacasting",
          channel_name: "SBS Essential",
          channel_network: "SBS",
          from: "2002.10",
          to: 2007.2,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS Two",
          channel_network: "SBS",
          from: 2009.6,
          to: 2013.4,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS2",
          channel_network: "SBS",
          from: 2013.4,
          to: 2016.11,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS Viceland",
          channel_network: "SBS",
          from: 2016.11,
          to: 2019.6,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS Viceland HD",
          channel_network: "SBS",
          from: 2019.6,
        },
      ],
      "32": [
        {
          channel_genre: "Television",
          channel_name: "SBS World News Channel",
          channel_network: "SBS",
          from: 2002.6,
          to: 2009.6,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS World Movies HD",
          channel_network: "SBS",
          from: 2019.7,
        },
      ],
      "33": [
        {
          channel_genre: "Television",
          channel_name: "Food Network",
          channel_network: "SBS",
          from: 2015.11,
          to: 2018.11,
        },
        {
          channel_genre: "Television",
          channel_name: "SBS Food",
          channel_network: "SBS",
          from: 2018.11,
        },
      ],
      "34": [
        {
          channel_genre: "Television",
          channel_name: "NITV",
          channel_network: "SBS",
          from: 2012.12,
          to: 2023.12,
        },
        {
          channel_genre: "Television",
          channel_name: "NITV HD",
          channel_network: "SBS",
          from: 2023.12,
        },
      ],
      "35": [
        {
          channel_genre: "Television",
          channel_name: "SBS WorldWatch",
          channel_network: "SBS",
          from: 2022.5,
        },
      ],
      "36": [
        {
          channel_genre: "Television",
          channel_name: "NITV",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "40": [
        {
          channel_genre: "Television",
          channel_name: "D44 Homepage",
          channel_network: "Digital 44 Trial",
          channel_notes: "Text Service",
          from: "2004.3",
          to: "2008.10",
        },
        {
          channel_genre: "Television",
          channel_name: "NITV",
          channel_network: "Digital 44 Trial",
          from: "2008.10",
          to: "2010.5",
        },
        {
          channel_genre: "Television",
          channel_name: "3D Trials",
          channel_network: "Other",
          channel_notes:
            "2010 State of Origin, content from SBS and 2010 AFL Grand Final",
          from: 2010.5,
          to: 2010.9,
        },
      ],
      "41": [
        {
          channel_genre: "Television",
          channel_name: "ABC News, Sport & Weather",
          channel_network: "Digital 44 Trial",
          channel_notes: "Text Service",
          from: "2004.3",
          to: "2010.5",
        },
      ],
      "42": [
        {
          channel_genre: "Television",
          channel_name: "D44 Homepage",
          channel_network: "Digital 44 Trial",
          channel_notes: "Text Service",
          from: "2004.3",
          to: "2010.5",
        },
      ],
      "44 (A)": [
        {
          channel_genre: "Television",
          channel_name: "Channel 44 (Adelaide)",
          channel_network: "Community",
          from: 2001.1,
        },
      ],
      "44 (B)": [
        {
          channel_genre: "Television",
          channel_name: "31 Digital (Brisbane)",
          channel_network: "Community",
          from: 2010.6,
          to: 2017.3,
        },
      ],
      "44 (M)": [
        {
          channel_genre: "Television",
          channel_name: "Channel 31 (Melbourne)",
          channel_network: "Community",
          from: 2001.1,
        },
      ],
      "44 (P)": [
        {
          channel_genre: "Television",
          channel_name: "West Television (Perth)",
          channel_network: "Community",
          from: 2010.4,
          to: 2020.2,
        },
      ],
      "44 (S)": [
        {
          channel_genre: "Television",
          channel_name: "D44 Homepage",
          channel_network: "Digital 44 Trial",
          channel_notes: "Text Service",
          from: "2004.3",
          to: "2010.3",
        },
        {
          channel_genre: "Television",
          channel_name: "Television Sydney",
          channel_network: "Digital 44 Trial",
          from: 2010.3,
          to: 2010.5,
        },
        {
          channel_genre: "Television",
          channel_name: "Television Sydney",
          channel_network: "Community",
          from: 2010.5,
          to: 2015.12,
        },
      ],
      "45": [
        {
          channel_genre: "Television",
          channel_name: "Channel NSW",
          channel_network: "Digital 44 Trial",
          channel_notes: "Community Channel with Government Announcements",
          from: "2004.3",
          to: "2009.7",
        },
        {
          channel_genre: "Television",
          channel_name: "Teachers TV",
          channel_network: "Digital 44 Trial",
          channel_notes: "Text Service",
          from: "2009.7",
          to: "2010.5",
        },
      ],
      "46": [
        {
          channel_genre: "Television",
          channel_name: "Australian Christian Channel",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004",
          to: "2010.5",
        },
      ],
      "47": [
        {
          channel_genre: "Television",
          channel_name: "Macquarie Digital",
          channel_network: "Digital 44 Trial",
          channel_notes: "Financial Information",
          from: "2004.10",
          to: "2007.6",
        },
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives / Teachers TV",
          channel_network: "Digital 44 Trial",
          channel_notes: "Teachers TV when HoR not in session",
          from: "2008.11",
          to: "2009.7",
        },
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2009.7",
          to: "2010.4",
        },
      ],
      "48": [
        {
          channel_genre: "Television",
          channel_name: "SportsTAB",
          channel_network: "Digital 44 Trial",
          channel_notes: "Sports Betting Odds",
          from: "2004.3",
          to: "2004.12",
        },
        {
          channel_genre: "Television",
          channel_name: "Federal Senate",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2008.11",
          to: "2010.4",
        },
      ],
      "49": [
        {
          channel_genre: "Television",
          channel_name: "Expo Channel",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2006",
          to: "2010.5",
        },
      ],
      "70": [
        {
          channel_genre: "Television",
          channel_name: "7HD",
          channel_network: "Seven",
          from: "2007.10",
          to: "2010.10",
        },
        {
          channel_genre: "Television",
          channel_name: "7HD",
          channel_network: "Seven",
          from: 2016.5,
        },
      ],
      "71": [
        {
          channel_genre: "Television",
          channel_name: "Seven Network",
          channel_network: "Seven",
          from: 2001.1,
        },
      ],
      "72": [
        {
          channel_genre: "Television",
          channel_name: "7Two",
          channel_network: "Seven",
          from: 2009.11,
          to: 2025,
        },
        {
          channel_genre: "Television",
          channel_name: "7Two HD",
          channel_network: "Seven",
          from: 2025,
        },
      ],
      "73": [
        {
          channel_genre: "Television",
          channel_name: "7Mate",
          channel_network: "Seven",
          from: 2010.9,
          to: 2022.12,
        },
      ],
      "74": [
        {
          channel_genre: "Television",
          channel_name: "Television 4",
          channel_network: "Seven",
          channel_notes: "Home Shopping / Infomercial Channel",
          from: 2011.9,
          to: 2011.12,
        },
        {
          channel_genre: "Television",
          channel_name: "TV4ME",
          channel_network: "Seven",
          channel_notes: "Home Shopping / Infomercial Channel",
          from: 2011.12,
          to: 2013,
        },
        {
          channel_genre: "Television",
          channel_name: "4ME",
          channel_network: "Seven",
          channel_notes: "Home Shopping / Infomercial Channel",
          from: 2013,
          to: 2016.5,
        },
        {
          channel_genre: "Television",
          channel_name: "Yesshop",
          channel_network: "Seven",
          channel_notes: "Home Shopping / Infomercial Channel",
          from: 2016.8,
          to: 2016.9,
        },
        {
          channel_genre: "Television",
          channel_name: "7Food Network",
          channel_network: "Seven",
          from: 2018.12,
          to: 2020.1,
        },
        {
          channel_genre: "Television",
          channel_name: "7Mate HD",
          channel_network: "Seven",
          from: 2020.1,
        },
      ],
      "75": [
        {
          channel_genre: "Television",
          channel_name: "Open Shop",
          channel_network: "Seven",
          from: 2019.8,
          to: 2021.9,
        },
        {
          channel_genre: "Television",
          channel_name: "7Bravo HD",
          channel_network: "Seven",
          from: 2023.1,
        },
      ],
      "76": [
        {
          channel_genre: "Television",
          channel_name: "7flix",
          channel_network: "Seven",
          from: 2016.2,
        },
      ],
      "77": [
        {
          channel_genre: "Television",
          channel_name: "Seven Guide",
          channel_network: "Seven",
          from: 2002.9,
          to: 2008.7,
        },
        {
          channel_genre: "Television",
          channel_name: "TVSN",
          channel_network: "Seven",
          from: 2024.7,
        },
      ],
      "78": [
        {
          channel_genre: "Television",
          channel_name: "Fresh Ideas TV",
          channel_network: "Seven",
          from: 2013.11,
          to: 2014.12,
        },
        {
          channel_genre: "Television",
          channel_name: "Racing.com",
          channel_network: "Seven",
          from: 2015,
        },
      ],
      "90": [
        {
          channel_genre: "Television",
          channel_name: "9HD",
          channel_network: "Nine",
          from: 2001.1,
          to: 2008.3,
        },
        {
          channel_genre: "Television",
          channel_name: "9HD (Breakaway Channel)",
          channel_network: "Nine",
          from: 2009.9,
          to: 2010.9,
        },
        {
          channel_genre: "Television",
          channel_name: "GEM",
          channel_network: "Nine",
          from: 2010.9,
          to: 2015.11,
        },
        {
          channel_genre: "Television",
          channel_name: "9HD",
          channel_network: "Nine",
          from: 2015.11,
        },
      ],
      "92": [
        {
          channel_genre: "Television",
          channel_name: "9Gem",
          channel_network: "Nine",
          from: 2010.9,
        },
      ],
      "93": [
        {
          channel_genre: "Television",
          channel_name: "9Go!",
          channel_network: "Nine",
          from: 2015.11,
        },
      ],
      "94": [
        {
          channel_genre: "Television",
          channel_name: "Extra",
          channel_network: "Nine",
          from: 2012.3,
          to: 2015.11,
        },
        {
          channel_genre: "Television",
          channel_name: "9Life",
          channel_network: "Nine",
          from: 2015.11,
        },
      ],
      "95": [
        {
          channel_genre: "Television",
          channel_name: "Extra 2",
          channel_network: "Nine",
          from: 2013.3,
          to: 2015.11,
        },
        {
          channel_genre: "Television",
          channel_name: "Extra",
          channel_network: "Nine",
          from: 2015.11,
          to: 2018.9,
        },
        {
          channel_genre: "Television",
          channel_name: "Your Money",
          channel_network: "Nine",
          channel_notes:
            "Joint Venture between Nine & Sky News, Business News Channel",
          from: "2018.10",
          to: 2019.5,
        },
        {
          channel_genre: "Television",
          channel_name: "9Gem HD",
          channel_network: "Nine",
          from: 2019.6,
        },
      ],
      "96": [
        {
          channel_genre: "Television",
          channel_name: "9Rush",
          channel_network: "Nine",
          from: 2020.5,
        },
      ],
      "97": [
        {
          channel_genre: "Television",
          channel_name: "Extra",
          channel_network: "Nine",
          from: "2010.10",
        },
      ],
      "99": [
        {
          channel_genre: "Datacasting",
          channel_name: "Nine Guide",
          channel_network: "Nine",
          from: 2001.8,
          to: 2008.11,
        },
        {
          channel_genre: "Television",
          channel_name: "9Go!",
          channel_network: "Nine",
          from: 2009.9,
          to: 2024.5,
        },
        {
          channel_genre: "Television",
          channel_name: "9Go! HD",
          channel_network: "Nine",
          from: 2024.5,
        },
      ],
      "100": [
        {
          channel_genre: "Television",
          channel_name: "Ten Guide",
          channel_network: "Ten",
          from: 2004.7,
          to: 2004.11,
        },
      ],
      "200": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Dig Radio",
          channel_network: "ABC",
          from: 2002.11,
          to: 2009.7,
        },
        {
          channel_genre: "Radio",
          channel_name: "ABC Dig Music",
          channel_network: "ABC",
          from: 2009.7,
          to: 2013.1,
        },
        {
          channel_genre: "Radio",
          channel_name: "ABC Double J",
          channel_network: "ABC",
          from: 2013.1,
        },
      ],
      "201": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Jazz",
          channel_network: "ABC",
          from: 2004.11,
        },
      ],
      "203": [
        {
          channel_genre: "Radio",
          channel_name: "ABC Country",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "204": [
        {
          channel_genre: "Radio",
          channel_name: "ABC News Radio",
          channel_network: "ABC",
          from: 2020.8,
        },
      ],
      "301": [
        {
          channel_genre: "Radio",
          channel_name: "SBS Radio 1",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "302": [
        {
          channel_genre: "Radio",
          channel_name: "SBS Radio 2",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "303": [
        {
          channel_genre: "Radio",
          channel_name: "SBS Radio 3",
          channel_network: "SBS",
          from: 2013.4,
        },
      ],
      "304": [
        {
          channel_genre: "Radio",
          channel_name: "SBS Arabic",
          channel_network: "SBS",
          from: 2016.3,
        },
      ],
      "305": [
        {
          channel_genre: "Radio",
          channel_name: "SBS South Asian",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "306": [
        {
          channel_genre: "Radio",
          channel_name: "SBS Chill",
          channel_network: "SBS",
          from: 2001.1,
        },
      ],
      "307": [
        {
          channel_genre: "Radio",
          channel_name: "SBS PopAsia",
          channel_network: "SBS",
          from: 2011.1,
        },
      ],
      "401": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "402": [
        {
          channel_genre: "Television",
          channel_name: "Federal Senate",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "403": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives Main Committee",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "404": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives Committee Room 1",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "405": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives Committee Room 2",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "406": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives Committee Room 3",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
      "407": [
        {
          channel_genre: "Television",
          channel_name: "Federal House of Representatives Committee Room 4",
          channel_network: "Digital 44 Trial",
          channel_notes: "",
          from: "2004.3",
          to: "2008.11",
        },
      ],
    },
    description: "Timeline of channel changes from 1995 to 1998",
    events: [
      {
        label: "DVB-T Launches in Metro Areas",
        note: "DVB-T Launches in Metro Areas",
        type: "Launch",
        when: "2001.1",
      },
      {
        label: "Digital Switchover Begins",
        note: "Digital Switchover Begins",
        type: "News",
        when: 2010,
      },
      {
        label: "Digital Switchover Completes",
        note: "Digital Switchover Completes",
        type: "News",
        when: 2013,
      },
    ],
    title: "Freeview Channel History (2001-)",
  },
  description: "Freeview (Metro) Channel Lineup History from 2001",
  id: "freeview_metro",
  name: "Freeview (Metro)",
};
