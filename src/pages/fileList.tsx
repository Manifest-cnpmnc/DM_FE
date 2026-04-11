import { useEffect, useState } from 'react'
import { getAuthUser, logout } from '../services/authService'
import { getDocuments, downloadDocument, downloadDocumentVersion } from '../services/documentService'
import type { DocumentItem } from '../services/documentService'

interface FileListPageProps {
  onSignOut: () => void
}

const statusColors: Record<string, string> = {
  DRAFT: '#f59e0b',
  PENDING_REVIEW: '#6366f1',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  ARCHIVED: '#6b7280',
}

export default function FileListPage({ onSignOut }: FileListPageProps) {
  const user = getAuthUser()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTitle, setSearchTitle] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [downloadId, setDownloadId] = useState<number | null>(null)

  const safeFilename = (title: string, url?: string) => {
    const extension = url?.split('.').pop() || 'bin'
    const sanitized = title.replace(/[^a-zA-Z0-9-_\. ]/g, '_')
    return `${sanitized}.${extension}`
  }

  const saveBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleDownloadLatest = async (doc: DocumentItem) => {
    setDownloadId(doc.id)
    try {
      const blob = await downloadDocument(doc.id)
      saveBlob(blob, safeFilename(doc.title, doc.latestFileUrl))
    } catch (err) {
      console.error(err)
      setError('Could not download the latest document version.')
    } finally {
      setDownloadId(null)
    }
  }

  const handleDownloadVersion = async (doc: DocumentItem) => {
    if (!doc.latestVersion) {
      setError('Version number is not available for this document.')
      return
    }
    setDownloadId(doc.id)
    try {
      const blob = await downloadDocumentVersion(doc.id, doc.latestVersion)
      saveBlob(blob, safeFilename(`${doc.title}-v${doc.latestVersion}`, doc.latestFileUrl))
    } catch (err) {
      console.error(err)
      setError('Could not download the selected document version.')
    } finally {
      setDownloadId(null)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getDocuments({
        title: searchTitle || undefined,
        status: statusFilter || undefined,
        page: 0,
        size: 20,
      })
      setDocuments(response.data.content)
    } catch (err) {
      console.error(err)
      setError('Could not load documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return (
    <div className="rap-root" style={{ background: '#f8fbff', minHeight: '100vh' }}>
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <span className="rap-nav__link">Hello, {user?.fullName ?? 'User'}</span>
          <button
            className="rap-nav__signin"
            type="button"
            onClick={() => {
              logout()
              onSignOut()
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="rap-main" style={{ padding: '32px 24px', width: '100%' }}>
        <div
          className="rap-form"
          style={{
            padding: '32px',
            width: '100%',
            maxWidth: '1180px',
            margin: '0 auto',
            borderRadius: '28px',
            minWidth: 0,
            background: '#ffffff',
            boxShadow: '0 28px 70px rgba(15, 23, 42, 0.08)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          <div className="rap-form__header" style={{ maxWidth: '100%', marginBottom: '12px' }}>
            <h1 className="rap-form__title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
              Document Library
            </h1>
            <p className="rap-form__subtitle" style={{ fontSize: '1rem', color: '#475569' }}>
              Browse your documents, review metadata, and download the latest version.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '260px', flex: 1 }}>
                <label className="rap-field__label">Search by title</label>
                <input
                  className="rap-field__input"
                  type="search"
                  placeholder="Search document titles"
                  value={searchTitle}
                  onChange={(event) => setSearchTitle(event.target.value)}
                  disabled={loading}
                />
              </div>
              <div style={{ minWidth: '260px', flex: 1, maxWidth: '260px' }}>
                <label className="rap-field__label">Status</label>
                <select
                  className="rap-field__select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  disabled={loading}
                >
                  <option value="">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div style={{ minWidth: '140px', alignSelf: 'flex-end', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="rap-actions__primary"
                  style={{ width: '100%' }}
                  onClick={fetchDocuments}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
                <button
                  type="button"
                  className="rap-actions__primary"
                  style={{ width: '100%', background: '#10b981' }}
                  onClick={() => {
                    setError(null)
                  }}
                >
                  Upload
                </button>
              </div>
            </div>

            {error ? (
              <div className="rap-notice" style={{ background: '#fde2e2', borderColor: '#fca5a5' }}>
                <div>
                  <p className="rap-notice__title" style={{ color: '#b91c1c' }}>Load error</p>
                  <p className="rap-notice__body" style={{ color: '#991b1b' }}>{error}</p>
                </div>
              </div>
            ) : null}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(221, 219, 213, 0.8)' }}>
                    <th style={{ padding: '14px 12px', color: '#1f2937', fontWeight: 700 }}>Title</th>
                    <th style={{ padding: '14px 12px', color: '#6b7280', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '14px 12px', color: '#6b7280', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 12px', color: '#6b7280', fontWeight: 600 }}>Author</th>
                    <th style={{ padding: '14px 12px', color: '#6b7280', fontWeight: 600 }}>Updated</th>
                    <th style={{ padding: '14px 12px', color: '#6b7280', fontWeight: 600 }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px 12px', color: '#6b7280' }}>
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid rgba(221, 219, 213, 0.4)' }}>
                                <td style={{ padding: '16px 12px', minWidth: '240px' }}>
                          <div style={{ fontWeight: 700, color: '#0d1f3c', fontSize: '0.96rem' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '6px' }}>{doc.description}</div>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563' }}>{doc.categoryName}</td>
                        <td style={{ padding: '16px 12px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              background: `${statusColors[doc.status] ?? '#e5e7eb'}33`,
                              color: statusColors[doc.status] ?? '#374151',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                            }}
                          >
                            {doc.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px', color: '#4b5563' }}>{doc.createdByName}</td>
                        <td style={{ padding: '16px 12px', color: '#4b5563' }}>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 12px', display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="rap-actions__primary"
                            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                            onClick={() => handleDownloadLatest(doc)}
                            disabled={downloadId === doc.id}
                          >
                            {downloadId === doc.id ? 'Downloading…' : 'Download latest'}
                          </button>
                          <button
                            type="button"
                            className="rap-actions__link"
                            onClick={() => handleDownloadVersion(doc)}
                            disabled={downloadId === doc.id || !doc.latestVersion}
                            style={{ padding: '10px 18px' }}
                          >
                            v{doc.latestVersion > 0 ? doc.latestVersion : 'N/A'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
