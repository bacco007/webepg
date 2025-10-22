import type { TimelineProvider } from "../timeline-data";

export const selectv: TimelineProvider = {
  category: "Subscription",
  country: "Australia",
  data: {
    axis: {
      end: 2011,
      start: 2005,
      unit: "year",
    },
    channels: {
      "1": [
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
          to: 1998.5,
        },
      ],
      "2": [
        {
          channel_genre: "Movies",
          channel_name: "Showtime",
          from: 1995.1,
          to: 1998.5,
        },
      ],
      "3": [
        {
          channel_genre: "Movies",
          channel_name: "Encore",
          from: 1995.1,
          to: 1998.5,
        },
      ],
      "4": [
        {
          channel_genre: "Entertainment",
          channel_name: "TV1",
          from: 1995.1,
          to: 1998.5,
        },
      ],
      "5": [
        {
          channel_genre: "Entertainment",
          channel_name: "Arena",
          from: 1995.1,
          to: 1998.5,
        },
      ],
      "6": [
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
          to: 1998.5,
        },
      ],
      "7": [
        {
          channel_genre: "Kids",
          channel_name: "Max",
          from: 1995.1,
          to: 1996,
        },
        {
          channel_genre: "Shared",
          channel_name: "Nickelodeon & Nick @ Nite",
          from: 1996,
          to: 1998.5,
        },
      ],
      "8": [
        {
          channel_genre: "Documentary",
          channel_name: "Quest",
          from: 1995.1,
          to: 1996,
        },
        {
          channel_genre: "Documentary",
          channel_name: "Discovery Channel",
          from: 1996,
          to: 1998.5,
        },
      ],
      "9": [
        {
          channel_genre: "News",
          channel_name: "CNBC Asia",
          from: 1996,
          to: 1998.5,
        },
      ],
      "10": [
        {
          channel_genre: "Shopping",
          channel_name: "TVSN",
          from: 1996,
          to: 1998.5,
        },
      ],
      "11": [
        {
          channel_genre: "News",
          channel_name: "BBC World",
          from: 1996,
          to: 1998.5,
        },
      ],
      "12": [
        {
          channel_genre: "Entertainment",
          channel_name: "thecomedychannel",
          from: 1996.6,
          to: 1998.5,
        },
      ],
      "13": [
        {
          channel_genre: "Shared",
          channel_name: "Galaxy Preview & Nightmoves",
          from: 1996,
          to: 1998.5,
        },
      ],
      "14": [
        {
          channel_genre: "Music",
          channel_name: "CMT",
          from: 1996,
          to: 1998.5,
        },
      ],
      "15": [
        {
          channel_genre: "Shared",
          channel_name: "Cartoon Network & TNT",
          from: 1997,
          to: 1998.5,
        },
      ],
      "16": [
        {
          channel_genre: "Lifestyle",
          channel_name: "The LifeStyle Channel",
          from: 1997,
          to: 1998.5,
        },
      ],
      "17": [
        {
          channel_genre: "International",
          channel_name: "New World Television",
          from: 1996,
          to: 1997,
        },
      ],
      "18": [
        {
          channel_genre: "Movies",
          channel_name: "World Movies",
          from: 1996,
          to: 1998.5,
        },
      ],
      "19": [
        {
          channel_genre: "International",
          channel_name: "TeleItalia Television",
          from: 1996,
          to: 1998.5,
        },
      ],
      "20": [
        {
          channel_genre: "Sports",
          channel_name: "Fox Sports Two",
          from: 1997,
          to: 1998.5,
        },
      ],
      "21": [
        {
          channel_genre: "Unknown",
          channel_name: "B-TV",
          from: 1996,
          to: 1997,
        },
        {
          channel_genre: "PPV",
          channel_name: "Pay Per View",
          from: 1997,
          to: 1998.5,
        },
      ],
    },
    description: "Timeline of channel changes from 1995 to 1998",
    events: [
      {
        label: "SelecTV Launches",
        note: "SelecTV Launches",
        type: "Launch",
        when: "2005.10",
      },
      {
        label: "WIN Corporation purchases 50.1%",
        note: "WIN Corporation purchases 50.1%",
        type: "News",
        when: 2006.8,
      },
      {
        label: "WIN Corporation purchases remaining 49.9%",
        note: "WIN Corporation purchases remaining 49.9%",
        type: "News",
        when: 2006.10,
      },
      {
        label: "SelecTV Collapses",
        note: "Enters Voluntary Administration, debt of $26 million",
        type: "Change",
        when: 2011.2,
      },
    ],
    title: "SelecTV Channel History (2005-2011)",
  },
  description: "SelecTV's Service from 2005 to 2011",
  id: "selectv",
  name: "SelecTV",
};
