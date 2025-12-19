export interface NewTemplate {
  id: string;
  name: string;
  screenCount: number;
  bullets: string[];
  category: string;
  icon?: string;
}

export const NEW_TEMPLATES: NewTemplate[] = [
  {
    id: 'birthday-kids-party',
    name: 'Birthday - Kids (Party Explosion)',
    screenCount: 4,
    category: 'Birthday',
    bullets: [
      'Colorful confetti intro',
      'Photo gallery with stickers',
      'Interactive game screen',
      'Birthday wish finale',
    ],
    icon: '🎈',
  },
  {
    id: 'birthday-partner-romantic',
    name: 'Birthday - Partner (Romantic Glow)',
    screenCount: 5,
    category: 'Birthday',
    bullets: [
      'Romantic photo opener',
      'Memory timeline',
      'Love letter screen',
      'Photo slideshow',
      'Birthday message',
    ],
    icon: '💕',
  },
  {
    id: 'anniversary-timeline',
    name: 'Anniversary - Timeline of Us',
    screenCount: 6,
    category: 'Anniversary',
    bullets: [
      'First meeting story',
      'Milestone timeline',
      'Photo journey',
      'Special moments',
      'Love notes',
      'Anniversary wish',
    ],
    icon: '💍',
  },
  {
    id: 'one-screen-emotional',
    name: 'One Screen Emotional Hit',
    screenCount: 1,
    category: 'Other',
    bullets: [
      'Powerful single message',
      'Hero image',
      'Emotional text',
    ],
    icon: '💫',
  },
  {
    id: 'baby-birth-announcement',
    name: 'Baby Birth Announcement',
    screenCount: 3,
    category: 'Baby',
    bullets: [
      'Birth stats card',
      'Photo gallery',
      'Welcome message',
    ],
    icon: '👶',
  },
  {
    id: 'graduation',
    name: 'Graduation',
    screenCount: 4,
    category: 'Other',
    bullets: [
      'Achievement opener',
      'Journey timeline',
      'Photo memories',
      'Congratulations message',
    ],
    icon: '🎓',
  },
  {
    id: 'thank-you-appreciation',
    name: 'Thank You / Appreciation',
    screenCount: 2,
    category: 'Thank you',
    bullets: [
      'Gratitude message',
      'Photo highlights',
    ],
    icon: '🙏',
  },
  {
    id: 'memorial-in-memory',
    name: 'Memorial / In Memory Of',
    screenCount: 3,
    category: 'Other',
    bullets: [
      'Tribute opener',
      'Life journey',
      'Memories gallery',
    ],
    icon: '🕯️',
  },
  {
    id: 'wedding-save-date',
    name: 'Wedding - Save the Date',
    screenCount: 4,
    category: 'Wedding',
    bullets: [
      'Couple photo hero',
      'Date and venue',
      'RSVP information',
      'Countdown timer',
    ],
    icon: '👰‍♀️',
  },
  {
    id: 'new-year-western',
    name: 'New Year - Western',
    screenCount: 3,
    category: 'Holiday',
    bullets: [
      'New Year greeting',
      'Year in review',
      'Resolutions',
    ],
    icon: '🎊',
  },
  {
    id: 'chinese-new-year',
    name: 'Chinese New Year',
    screenCount: 3,
    category: 'Holiday',
    bullets: [
      'Traditional greeting',
      'Year of the zodiac',
      'Wishes and blessings',
    ],
    icon: '🧧',
  },
  {
    id: 'blank-canvas-pro',
    name: 'Blank Canvas – Pro Mode',
    screenCount: 1,
    category: 'Other',
    bullets: [
      'Start from scratch',
      'Full customization',
      'Complete freedom',
    ],
    icon: '🎨',
  },
];
