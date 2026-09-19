import {MediaLibrary} from '../components/MediaLibrary'

export function MediaPage() {
  return (
    <div className="admin-content">
      <h1 className="page-title">Media</h1>
      <MediaLibrary mode="page" />
    </div>
  )
}
