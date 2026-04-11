import { useState, type ChangeEvent, useRef } from 'react'
import heroImg from '../assets/hero.png'
import '../styles/register.css'
import { uploadDocument } from '../services/documentService'
import { AxiosError } from 'axios'

interface UploadFormState {
  title: string
  description: string
  categoryId: string
  tags: string
}

interface UploadPageProps {
  onBack: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  { id: '1', name: 'Legal' },
  { id: '2', name: 'Technical' },
  { id: '3', name: 'Financial' },
  { id: '4', name: 'Administrative' },
  { id: '5', name: 'Project' },
]

export default function UploadPage({ onBack, onSuccess }: UploadPageProps) {
  const [form, setForm] = useState<UploadFormState>({
    title: '',
    description: '',
    categoryId: '1',
    tags: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4200)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showToast('Title is required.')
      return
    }
    if (!selectedFile) {
      showToast('Please select a file to upload.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('categoryId', form.categoryId)
      
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      tagsArray.forEach(tag => formData.append('tags', tag))

      const response = await uploadDocument(formData)
      
      if (response.success) {
        showToast('Document uploaded successfully.', 'success')
        setTimeout(() => onSuccess(), 1500)
      } else {
        showToast(response.message || 'Upload failed.', 'error')
      }
    } catch (error: unknown) {
      let message = 'Unable to upload document. Please try again.'
      if (error instanceof AxiosError && error.response?.data) {
        message = (error.response.data as any).message || message
      }
      showToast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <button className="rap-nav__signin" type="button" onClick={onBack} disabled={isLoading}>
            Back to Library
          </button>
        </div>
      </nav>

      <div className="rap-body">
        <aside className="rap-aside">
          <div className="rap-aside__overlay" />
          <div className="rap-aside__content">
            <div className="rap-aside__visual">
              <img src={heroImg} alt="Upload visual" />
            </div>
            <p className="rap-aside__label">Contribute to the archive</p>
            <h2 className="rap-aside__title">
              Upload New<br />Document
            </h2>
            <p className="rap-aside__desc">
              Add new records to our secure database. Ensure all metadata is accurate
              for better searchability and classification.
            </p>
          </div>
        </aside>

        <main className="rap-main">
          <div className="rap-form" style={{ maxWidth: '640px' }}>
            {toast ? (
              <div className={`rap-toast rap-toast--${toast.type}`}>
                {toast.message}
              </div>
            ) : null}
            <div className="rap-form__header">
              <h1 className="rap-form__title">Document Details</h1>
              <p className="rap-form__subtitle">
                Provide metadata and select the file you wish to upload.
              </p>
            </div>

            <div className="rap-form__grid">
              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Document Title</label>
                <input
                  className="rap-field__input"
                  type="text"
                  name="title"
                  placeholder="e.g. Annual Report 2023"
                  value={form.title}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Description</label>
                <textarea
                  className="rap-field__input"
                  name="description"
                  placeholder="Provide a brief summary of the document..."
                  style={{ height: '100px', padding: '12px 18px', resize: 'vertical' }}
                  value={form.description}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field">
                <label className="rap-field__label">Category</label>
                <div className="rap-select-wrap">
                  <select
                    className="rap-field__select"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rap-field">
                <label className="rap-field__label">Tags (comma separated)</label>
                <input
                  className="rap-field__input"
                  type="text"
                  name="tags"
                  placeholder="legal, archive, 2023"
                  value={form.tags}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">File Selection</label>
                <div 
                  className="rap-notice" 
                  style={{ 
                    cursor: 'pointer', 
                    borderStyle: 'dashed', 
                    background: selectedFile ? '#f0fdf4' : '#f9fafb',
                    borderColor: selectedFile ? '#16a34a' : '#dddbd5'
                  }}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <p className="rap-notice__title" style={{ color: selectedFile ? '#15803d' : '#0d1f3c' }}>
                      {selectedFile ? 'File Selected' : 'Click to select file'}
                    </p>
                    <p className="rap-notice__body">
                      {selectedFile ? selectedFile.name : 'PDF, DOCX, JPG, PNG up to 10MB'}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="rap-actions">
              <button
                className="rap-actions__primary"
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading…' : 'Upload Document'}
              </button>
              <button
                type="button"
                className="rap-actions__secondary"
                onClick={onBack}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="rap-footer">
        <span>© 2024 Architectural Archive. Secure Government Infrastructure.</span>
        <div className="rap-footer__links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Accessibility</a>
          <a href="#">Department Portal</a>
        </div>
      </footer>
    </div>
  )
}
