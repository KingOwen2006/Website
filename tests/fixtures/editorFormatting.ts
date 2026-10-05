const picture = (key: string, color: string) => ({
  _type: 'image', _key: key, alt: key, caption: `${key} caption`,
  asset: {_id: `image-${key}`, url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${color}"/></svg>`)}`},
})
const text = (key: string, content: string, style = 'normal', marks: string[] = []) => ({
  _type: 'block', _key: key, style, markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text: content, marks}],
})
export const formattingBody = [
  text('heading', 'New layouts', 'h2'),
  {_type: 'layoutRow', _key: 'mixed-row', items: [
    {_type: 'layoutCell', _key: 'photo', body: [picture('First image', '#3575d3')]},
    {_type: 'layoutCell', _key: 'text', body: [text('row-text', 'Side by side text keeps its formatting.', 'normal', ['strong'])]},
  ]},
  {_type: 'layoutRow', _key: 'images-row', items: [
    {_type: 'layoutCell', _key: 'left', body: [picture('Left image', '#6b9c65')]},
    {_type: 'layoutCell', _key: 'right', body: [picture('Right image', '#a76042')]},
  ]},
  {_type: 'imageRow', _key: 'legacy-row', images: [picture('Legacy image', '#554f88'), picture('Legacy second', '#557788')]},
  {_type: 'imageCompare', _key: 'compare', before: picture('Before', '#343a5a'), after: picture('After', '#bd6742'), caption: 'Comparison caption'},
  text('refs-heading', 'References', 'h2'),
  text('references', 'Available at: https://www.nhs.uk/mental-health/conditions/schizophrenia/overview/ [Accessed 2 Oct. 2026].'),
]
