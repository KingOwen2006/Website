export const categories = {
  cars: "Cars",
  characters: "Characters",
  prints: "3D prints",
  website: "Website",
} as const;

export type Category = keyof typeof categories;
export type Artwork = "car" | "portrait" | "print" | "website" | "twidget";

export type Card = {
  id: string;
  category: Category;
  title: string;
  summary: string;
  description: string;
  artwork: Artwork;
  link?: { href: string; label: string };
  contribution?: {
    icon: string;
    actions: { href: string; label: string; icon: string }[];
  };
};

export const projects: Card[] = [
  {
    id: "twidget",
    category: "website",
    title: "Twidget",
    summary: "Twitter/X analytics app with pretty widgets and a clean One UI design.",
    description: "I contributed ideas to Twidget, an Android app for tracking Twitter/X stats and bringing them to your home screen with widgets.",
    artwork: "twidget",
    link: { href: "https://github.com/thatjoshguy67/twidget", label: "View Twidget on GitHub" },
    contribution: {
      icon: "twidget-icon.png",
      actions: [
        { href: "https://play.google.com/store/apps/details?id=com.tjg.twidget", label: "Twidget on Google Play", icon: "twidget-play.svg" },
        { href: "https://github.com/thatjoshguy67/twidget", label: "Twidget on GitHub", icon: "twidget-github.svg" },
      ],
    },
  },
  {
    id: "bmw-e30",
    category: "cars",
    title: "BMW E30",
    summary: "A blue BMW E30, modelled in 3D.",
    description: "The model at the centre of this portfolio. The front three-quarter view shows the E30’s twin headlamps, boxy bodywork and rear spoiler.",
    artwork: "car",
  },
  {
    id: "illustrated-portrait",
    category: "characters",
    title: "Illustrated portrait",
    summary: "The illustrated avatar used across the portfolio.",
    description: "A layered vector portrait drawn in Figma. The hair, face and clothing are separate pieces of artwork.",
    artwork: "portrait",
  },
  {
    id: "3d-printing",
    category: "prints",
    title: "3D printing",
    summary: "Taking a digital model from Blender to a physical print.",
    description: "3D printing is one of the ways I finish my models. I build the geometry in Blender and use Bambu Lab tools when preparing a physical print.",
    artwork: "print",
    link: { href: "#shop", label: "Browse the shop" },
  },
  {
    id: "portfolio-website",
    category: "website",
    title: "This website",
    summary: "A home for my cars, characters and 3D prints.",
    description: "I designed this portfolio in Figma. It brings together my work in car modelling and character design, with space for 3D prints as I add them.",
    artwork: "website",
    link: { href: "#home", label: "Back to the homepage" },
  },
];
