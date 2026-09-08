export type PortfolioCategory = 'all' | 'cars' | 'characters' | 'prints' | 'games'

export type PortfolioItem = {
  id: string
  title: string
  category: Exclude<PortfolioCategory, 'all'>
  image: string
  description: string
  tools: string[]
  status: 'finished' | 'wip' | 'personal'
}

export const SPECIALTIES = [
  { label: 'Cars', icon: '🏎️', description: 'Hard-surface & automotive' },
  { label: 'Characters', icon: '🧍', description: 'Stylised & realistic' },
  { label: '3D Prints', icon: '🖨️', description: 'Print-ready models' },
  { label: 'UE5 Games', icon: '🎮', description: 'Small interactive projects' },
] as const

export const SOFTWARE = [
  { name: 'Blender', image: '/img/Blender.png' },
  { name: 'Unreal Engine 5', image: '/img/Blender.png' },
] as const

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'vehicle-study',
    title: 'Vehicle Study',
    category: 'cars',
    image: '/img/forza-horizon-6.png',
    description: 'Automotive hard-surface practice inspired by racing games I love.',
    tools: ['Blender'],
    status: 'wip',
  },
  {
    id: 'character-wip',
    title: 'Character Sculpt',
    category: 'characters',
    image: '/img/Pfp.jpg',
    description: 'Stylised character work — topology, UVs, and material passes.',
    tools: ['Blender'],
    status: 'wip',
  },
  {
    id: 'printable-build',
    title: 'Printable Build',
    category: 'prints',
    image: '/img/Blender.png',
    description: 'Modelled and prepped for resin printing — supports, scale, and cleanup.',
    tools: ['Blender'],
    status: 'personal',
  },
  {
    id: 'ue5-prototype',
    title: 'UE5 Prototype',
    category: 'games',
    image: '/img/forza-horizon-6.png',
    description: 'Small game prototype built in Unreal Engine 5 for fun.',
    tools: ['Blender', 'UE5'],
    status: 'personal',
  },
  {
    id: 'this-site',
    title: 'This Website',
    category: 'games',
    image: '/img/Pfp.jpg',
    description: 'Personal portfolio built with React, TypeScript, and Vite.',
    tools: ['React', 'TypeScript'],
    status: 'finished',
  },
]

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  all: 'All work',
  cars: 'Cars',
  characters: 'Characters',
  prints: '3D Prints',
  games: 'Games',
}
