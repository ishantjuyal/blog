export type Project = {
  slug: string;
  shortDescription: string;
  name: string;
  url: string;
  type: string;
  status: string;
  metricLabel: string;
  metric: string;
  description: string;
  owned: string;
  tags: string[];
  code: string;
  logo?: string;
  favorite?: boolean;
};

export const projects: Project[] = [
  {
    name: "PM Quest",
    slug: "pm-quest",
    shortDescription: "A little product practice, every day.",
    url: "https://pmquest.ishantjuyal.com/",
    type: "Product practice",
    status: "Live",
    metricLabel: "North star",
    metric: "WAU",
    description:
      "Practice product management with daily prompts. Write an answer, get AI feedback, compare approaches with other people, and build a streak.",
    owned: "I designed the practice and feedback flow, ran activation and retention experiments, and worked on how the product is presented.",
    tags: ["AI feedback", "Streaks", "Learning loop"],
    code: "PMQ",
    logo: "/images/logos/pmquest-logo-square.png",
    favorite: true,
  },
  {
    name: "TailorUp",
    slug: "tailorup",
    shortDescription: "A resume that fits the role.",
    url: "https://tailorup.vercel.app/",
    type: "Utility",
    status: "Live",
    metricLabel: "Job-to-resume",
    metric: "2 min",
    description: "Tailor your resume for any job in a few minutes.",
    owned: "I took this from the initial problem through flow design, building, and launch.",
    tags: ["Resume", "AI utility", "Career"],
    code: "TLR",
    logo: "/images/logos/tailorup-logo.svg",
    favorite: true,
  },
  {
    name: "Appvia",
    slug: "appvia",
    shortDescription: "App reviews, straight to Slack.",
    url: "https://www.appvia.live/",
    type: "Voice-of-customer tool",
    status: "Live",
    metricLabel: "Adoption",
    metric: "5-6 teams",
    description: "Play Store reviews of your app, auto-delivered to your Slack.",
    owned:
      "Built from a Pickup Coffee need: daily Play Store review monitoring, Slack delivery, issue visibility, and product packaging.",
    tags: ["Play Store", "Slack bot", "VOC ops"],
    code: "APV",
    favorite: true,
  },
  {
    name: "Loopwise",
    slug: "loopwise",
    shortDescription: "A place for useful product feedback.",
    url: "https://www.loopwise.live/",
    type: "Feedback tool",
    status: "Live",
    metricLabel: "Loop",
    metric: "Feedback",
    description: "Collect feedback that actually moves things.",
    owned: "I worked on how feedback is collected and used, and how to explain the product on its landing page.",
    tags: ["Feedback", "SaaS", "Research"],
    code: "LPW",
  },
  {
    name: "Secret Santa Organizer",
    slug: "secret-santa",
    shortDescription: "Gift exchanges without the spreadsheet.",
    url: "https://www.secretsanta.world/",
    type: "Seasonal app",
    status: "Live",
    metricLabel: "Use case",
    metric: "Groups",
    description: "An online Secret Santa gift exchange organizer.",
    owned: "I designed the group setup and participant matching, keeping the experience simple for everyone joining an exchange.",
    tags: ["Consumer", "Groups", "Utility"],
    code: "SSO",
  },
  {
    name: "Year Progress Tracker",
    slug: "year-progress",
    shortDescription: "A small reminder of the year going by.",
    url: "https://chromewebstore.google.com/detail/acdnmoeegibdamcidkjohklcnnhghfdf?utm_source=item-share-cb",
    type: "Chrome extension",
    status: "Live",
    metricLabel: "Surface",
    metric: "Chrome",
    description: "A Chrome extension to help people track yearly progress and goals.",
    owned: "I developed the idea, designed the progress display, and launched the extension.",
    tags: ["Chrome", "Habits", "Progress"],
    code: "YPT",
  },
  {
    name: "Focus Hours",
    slug: "focus-hours",
    shortDescription: "Fewer distracting tabs. More focus.",
    url: "https://chromewebstore.google.com/detail/focus-hours/ogldhbljdkjlcmlfhlebfbfnonlahflh?authuser=0&hl=en-GB",
    type: "Chrome extension",
    status: "Live",
    metricLabel: "Behavior",
    metric: "Focus",
    description: "Maintain better focus by blocking specific websites.",
    owned: "I designed the focus flow and website-blocking rules, and packaged the extension.",
    tags: ["Chrome", "Focus", "Behavior"],
    code: "FCS",
  },
];
