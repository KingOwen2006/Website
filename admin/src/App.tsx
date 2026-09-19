import type {ReactNode} from 'react'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import {AdminShell} from './components/AdminShell'
import {AuthProvider, useAuth} from './lib/auth'
import {AuthorEditPage} from './pages/AuthorEditPage'
import {AuthorsPage} from './pages/AuthorsPage'
import {ChapterEditPage} from './pages/ChapterEditPage'
import {ChaptersPage} from './pages/ChaptersPage'
import {LoginPage} from './pages/LoginPage'
import {MediaPage} from './pages/MediaPage'
import {PostEditPage} from './pages/PostEditPage'
import {PostsPage} from './pages/PostsPage'
import {TaxonomiesPage} from './pages/TaxonomiesPage'
import {TaxonomyEditPage} from './pages/TaxonomyEditPage'

function Guard({children}: {children: ReactNode}) {
  const {loading, signedIn} = useAuth()
  if (loading) return <div className="admin-content">Loading…</div>
  if (!signedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <Guard>
                <AdminShell />
              </Guard>
            }
          >
            <Route path="/" element={<Navigate to="/posts" replace />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/posts/year-1" element={<PostsPage />} />
            <Route path="/posts/year-2" element={<PostsPage />} />
            <Route path="/posts/drafts" element={<PostsPage />} />
            <Route path="/posts/published" element={<PostsPage />} />
            <Route path="/posts/scheduled" element={<PostsPage />} />
            <Route path="/posts/trash" element={<PostsPage />} />
            <Route path="/posts/:id" element={<PostEditPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/authors/:id" element={<AuthorEditPage />} />
            <Route path="/categories" element={<TaxonomiesPage kind="category" />} />
            <Route path="/categories/:id" element={<TaxonomyEditPage kind="category" />} />
            <Route path="/tags" element={<TaxonomiesPage kind="tag" />} />
            <Route path="/tags/:id" element={<TaxonomyEditPage kind="tag" />} />
            <Route path="/course-years" element={<ChaptersPage />} />
            <Route path="/course-years/:id" element={<ChapterEditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
