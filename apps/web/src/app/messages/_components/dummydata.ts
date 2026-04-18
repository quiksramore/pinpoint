// DUMMY DATA ONLY - REPLACE WITH REAL DATA LATER (I made up my own schema it mgiht be gg)
type Conversation = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
};

export const conversations: Conversation[] = [
  {
    id: "1",
    name: "Mara Solano",
    handle: "@marasolano",
    avatar: "MS",
    lastMessage: "sounds good, see you then 👋",
    timestamp: "2m",
    unread: 0,
    online: true,
  },
  {
    id: "2",
    name: "Dev Kapoor",
    handle: "@devkaps",
    avatar: "DK",
    lastMessage: "did you push the branch yet?",
    timestamp: "14m",
    unread: 3,
    online: true,
  },
  {
    id: "3",
    name: "Jules Hartman",
    handle: "@julesh",
    avatar: "JH",
    lastMessage: "lol no way that actually worked",
    timestamp: "1h",
    unread: 1,
    online: false,
  },
  {
    id: "4",
    name: "Priya Nair",
    handle: "@priyanair",
    avatar: "PN",
    lastMessage: "can you send me that figma link?",
    timestamp: "3h",
    unread: 0,
    online: true,
  },
  {
    id: "5",
    name: "Tom Ellison",
    handle: "@tomellison",
    avatar: "TE",
    lastMessage: "on my way",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "6",
    name: "Sasha Volk",
    handle: "@sashav",
    avatar: "SV",
    lastMessage: "the new build looks clean",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "7",
    name: "Noel Park",
    handle: "@noelpark",
    avatar: "NP",
    lastMessage: "coffee tomorrow?",
    timestamp: "Mon",
    unread: 0,
    online: false,
  },
];

export const avatarColors: Record<string, string> = {
  MS: "bg-primary",
  DK: "bg-secondary",
  JH: "bg-accent",
  PN: "bg-muted",
  TE: "bg-primary",
  SV: "bg-secondary",
  NP: "bg-accent",
};
