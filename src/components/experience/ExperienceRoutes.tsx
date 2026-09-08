import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import ChapterView from './ChapterView'
import ExperienceSection from './ExperienceSection'
import UnitView from './UnitView'

type ExperienceRoutesProps = {
  websiteLogo?: string
}

function ChapterRoute() {
  const { chapterSlug } = useParams()
  if (!chapterSlug) return <Navigate to="/experience" replace />
  return <ChapterView chapterSlug={chapterSlug} />
}

function UnitRoute() {
  const { chapterSlug, unitSlug } = useParams()
  if (!chapterSlug || !unitSlug) return <Navigate to="/experience" replace />
  return <UnitView chapterSlug={chapterSlug} unitSlug={unitSlug} />
}

export default function ExperienceRoutes({ websiteLogo }: ExperienceRoutesProps) {
  return (
    <Routes>
      <Route index element={<ExperienceSection websiteLogo={websiteLogo} />} />
      <Route path=":chapterSlug" element={<ChapterRoute />} />
      <Route path=":chapterSlug/:unitSlug" element={<UnitRoute />} />
    </Routes>
  )
}
