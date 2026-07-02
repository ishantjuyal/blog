export const resume = {
  name: "Ishant Juyal",
  headline: "Product Manager and ex-founder",
  pdfPath: "/files/Ishant-Juyal-Resume.pdf",
  summary:
    "Product Manager and ex-founder with 5 years of experience building consumer apps, growth systems, analytics foundations, and workflow-heavy products across fintech, consumer commerce, and 0→1 startups.",
  contacts: [
    { label: "Website", value: "ishantjuyal.com", href: "https://ishantjuyal.com/" },
    { label: "LinkedIn", value: "LinkedIn", href: "https://www.linkedin.com/in/ishantjuyal/" },
    { label: "GitHub", value: "GitHub", href: "https://github.com/ishantjuyal/" },
    { label: "Email", value: "ishantnit@gmail.com", href: "mailto:ishantnit@gmail.com" },
    { label: "Phone", value: "+91-9729247053", href: "tel:+919729247053" },
  ],
  experience: [
    {
      role: "Product Manager",
      company: "Pickup Coffee via Shuru",
      companyParts: [
        { text: "Pickup Coffee", href: "https://pickup-coffee.com/" },
        { text: " via " },
        { text: "Shuru", href: "https://shurutech.com/" },
      ],
      period: "Oct 2024 – Present",
      bullets: [
        "Launched in-app Delivery by integrating Pandago end-to-end; delivery now contributing 15% of app orders and approximately 9.6M Peso in monthly revenue.",
        "Led Mexico product launch end-to-end across Customer App, Barista App, and Backoffice, owning localization, market-specific user and store flows, payment readiness, integrations, and release planning.",
        "Built Pickup Coffee’s product analytics foundation by leading CleverTap migration, event taxonomy, and A/B testing guidelines, enabling teams to track user journeys, campaign performance, feature adoption, and product impact.",
        "Ideated and launched Quests - a gamification feature driving 80K+ user engagements, 2.2K quest completions, and 1.3K reward claims. Orders per user increased by 17% increasing revenue by 5M Peso during the campaign.",
        "Built and launched Gift Cards as a new revenue lever, defining user journeys, redemption flows, and rollout strategy; generated additional sales of 120K Peso during the Christmas campaign.",
        "Reduced order-update SMS costs by approximately $3K/month by shifting communication from SMS to push notifications, saving around $36K/year while preserving customer communication coverage.",
        "Proactively identified and solved an unowned app-rating opportunity by launching a post-order rating nudge, improving the percentage of 5-star ratings by 5 percentage points in the first 30 days.",
        "Proactively identified an app-rating improvement opportunity by launching a post-order rating nudge; launched it and improved the % share of 5-star ratings from 83% to 90% and app ratings from 4.64 to 4.74 in 6 months.",
      ],
    },
    {
      role: "Co-founder and Product Head",
      company: "Crework",
      period: "Dec 2023 – Sep 2024",
      bullets: [
        "Built an in-house Learning Management System to run live PM cohorts end-to-end, improving learner experience and reducing manual operating effort across cohort delivery, tracking, and communication.",
        "Scaled a bootstrapped cohort-based course to ₹3L revenue per batch while owning product, sales, operations, marketing, and customer feedback loops.",
        "Redesigned website and application funnel, driving 90% form completion and shifting 50% of enrollments to onboarding-led conversion instead of sales-call-led conversion.",
      ],
    },
    {
      role: "Associate Product Manager",
      company: "Houseworks",
      companyParts: [{ text: "Houseworks", href: "https://houseworksinc.co/" }],
      period: "Jul 2022 – Dec 2023",
      bullets: [
        "Led end-to-end UI overhaul for an oncology EMR and patient portal, reducing patient-portal complaints by 15% through workflow, usability, and information-architecture improvements.",
        "Worked with healthcare users and internal teams to translate complex operational workflows into clearer product flows for clinical and patient-facing use cases.",
      ],
    },
    {
      role: "Product Analyst",
      company: "Jar",
      companyParts: [{ text: "Jar", href: "https://www.myjar.app/" }],
      period: "October 2021 – July 2022",
      bullets: [
        "Designed experiments across home-screen offers and nudges, improving home screen to first transaction conversion from 10% to 14%.",
        "Analyzed one-time gold purchase behavior and optimized recommended purchase amounts, improving conversion and average order value for the flow.",
        "Collaborated with the growth team to improve WoW retention by 20% using targeted push notification campaigns based on user behaviour.",
      ],
    },
  ],
  skills: [
    {
      label: "Product Management",
      value:
        "Product discovery, PRDs, roadmap prioritization, user journeys, feature ownership, stakeholder alignment, product launches",
    },
    {
      label: "Growth & Consumer Behavior",
      value:
        "Activation, retention, engagement loops, onboarding, lifecycle journeys, push notifications",
    },
    {
      label: "Analytics & Experimentation",
      value:
        "Funnel analysis, cohort analysis, A/B testing, event taxonomy, metric definition, experiment design, impact analysis",
    },
    {
      label: "Workflow Systems",
      value:
        "Internal tools, operational workflows, voucher/reward systems, location/store logic, delivery flows, release planning",
    },
    {
      label: "AI & Prototyping",
      value: "AI-assisted prototyping, rapid MVP building, workflow automation, product demos",
    },
    {
      label: "Tools",
      value: "CleverTap, Amplitude, SQL, Python, Metabase, Excel/Google Sheets, Jira, Figma, Slack",
    },
  ],
  education: {
    school: "National Institute of Technology, Kurukshetra",
    degree: "Bachelor of Technology, Mechanical Engineering",
    period: "2017-2021",
  },
} as const;

export type Resume = typeof resume;
