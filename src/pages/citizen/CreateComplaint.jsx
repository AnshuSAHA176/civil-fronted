import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ImagePlus, MapPin, Navigation, Trash2, Upload } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { createComplaint } from '../../features/complaints/complaints.api'
import { getApiError } from '../../services/apiClient'

const INITIAL_FORM = {
  title: '',
  description: '',
  latitude: '',
  longitude: '',
  landmark: '',
  address: '',
}

function validate(form, files) {
  const errors = {}
  const title = form.title.trim()
  const description = form.description.trim()

  if (!title) errors.title = 'Title is required.'
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.'

  if (!description) errors.description = 'Description is required.'

  if (form.latitude !== '') {
    const latitude = Number(form.latitude)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.'
    }
  }

  if (form.longitude !== '') {
    const longitude = Number(form.longitude)
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.'
    }
  }

  if (files.some((file) => !file.type.startsWith('image/'))) {
    errors.images = 'Only image files can be uploaded.'
  }

  return errors
}

export default function CreateComplaint() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setApiError('')
  }

  const addFiles = (event) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return

    const invalid = selected.some((file) => !file.type.startsWith('image/'))
    if (invalid) {
      setErrors((current) => ({ ...current, images: 'Only image files can be uploaded.' }))
    } else {
      setErrors((current) => ({ ...current, images: undefined }))
      setFiles((current) => [...current, ...selected])
    }

    // Allows selecting the same file again after removing it.
    event.target.value = ''
  }

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((current) => ({ ...current, location: 'Geolocation is not supported by this browser.' }))
      return
    }

    setIsLocating(true)
    setErrors((current) => ({ ...current, location: undefined }))

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }))
        setIsLocating(false)
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can enter the coordinates manually.'
          : 'Unable to get your current location. You can enter the coordinates manually.'
        setErrors((current) => ({ ...current, location: message }))
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError('')

    const validationErrors = validate(form, files)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    formData.append('landmark', form.landmark.trim())
    formData.append('address', form.address.trim())

    if (form.latitude !== '') formData.append('latitude', form.latitude)
    if (form.longitude !== '') formData.append('longitude', form.longitude)
    files.forEach((file) => formData.append('images', file))

    setIsSubmitting(true)

    try {
      await createComplaint(formData)
      navigate('/citizen/complaints', {
        replace: true,
        state: {
          successMessage: 'Your complaint was submitted successfully. CivicAI is processing it now.',
        },
      })
    } catch (error) {
      setApiError(getApiError(error).message)
      setIsSubmitting(false)
    }
  }

  return (
    <section className="create-complaint-page">
      <div className="create-complaint-header">
        <div>
          <Link className="back-link" to="/citizen/complaints">
            <ArrowLeft size={16} />
            Back to complaints
          </Link>
          <p className="eyebrow">Report an issue</p>
          <h1>Create a complaint</h1>
          <p>Tell us what happened and where. CivicAI will classify and route the issue automatically.</p>
        </div>
      </div>

      {apiError && <Alert variant="danger">{apiError}</Alert>}

      <form className="create-complaint-form" onSubmit={handleSubmit} noValidate>
        <section className="form-panel">
          <div className="form-panel-heading">
            <div>
              <span className="form-step">01</span>
              <div>
                <h2>Describe the issue</h2>
                <p>Give enough detail for the civic team and AI classifier to understand the problem.</p>
              </div>
            </div>
          </div>

          <Input
            id="complaint-title"
            name="title"
            label="Title"
            placeholder="e.g. Large pothole near the main road"
            value={form.title}
            onChange={updateField}
            error={errors.title}
            maxLength={200}
            required
          />

          <Textarea
            id="complaint-description"
            name="description"
            label="Description"
            placeholder="Describe what is happening, how serious it is, and how it affects people."
            value={form.description}
            onChange={updateField}
            error={errors.description}
            required
          />
        </section>

        <section className="form-panel">
          <div className="form-panel-heading">
            <div>
              <span className="form-step">02</span>
              <div>
                <h2>Where is it?</h2>
                <p>Location helps CivicAI route the complaint to the appropriate department.</p>
              </div>
            </div>
            <MapPin size={20} aria-hidden="true" />
          </div>

          <Textarea
            id="complaint-address"
            name="address"
            label="Address"
            placeholder="Enter the street, locality, or full address"
            value={form.address}
            onChange={updateField}
          />

          <Input
            id="complaint-landmark"
            name="landmark"
            label="Landmark"
            placeholder="e.g. Near the community hall"
            value={form.landmark}
            onChange={updateField}
          />

          <div className="location-action-row">
            <Button type="button" variant="secondary" onClick={useCurrentLocation} loading={isLocating}>
              <Navigation size={16} />
              Use my current location
            </Button>
            <span className="location-helper">This only fills your latitude and longitude.</span>
          </div>

          {errors.location && <p className="field-error location-error">{errors.location}</p>}

          <div className="coordinate-grid">
            <Input
              id="complaint-latitude"
              name="latitude"
              label="Latitude"
              inputMode="decimal"
              placeholder="e.g. 26.7271"
              value={form.latitude}
              onChange={updateField}
              error={errors.latitude}
            />
            <Input
              id="complaint-longitude"
              name="longitude"
              label="Longitude"
              inputMode="decimal"
              placeholder="e.g. 88.3953"
              value={form.longitude}
              onChange={updateField}
              error={errors.longitude}
            />
          </div>
        </section>

        <section className="form-panel">
          <div className="form-panel-heading">
            <div>
              <span className="form-step">03</span>
              <div>
                <h2>Add evidence</h2>
                <p>Upload photos that help demonstrate the issue. Images are optional.</p>
              </div>
            </div>
            <ImagePlus size={20} aria-hidden="true" />
          </div>

          <input
            ref={fileInputRef}
            className="visually-hidden-input"
            id="complaint-images"
            type="file"
            accept="image/*"
            multiple
            onChange={addFiles}
          />

          <button
            className="upload-zone"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-describedby={errors.images ? 'images-error' : undefined}
          >
            <span className="upload-icon"><Upload size={22} /></span>
            <strong>Choose photos</strong>
            <span>JPG, PNG, WebP and other browser-supported image formats</span>
          </button>

          {errors.images && <p className="field-error" id="images-error">{errors.images}</p>}

          {previews.length > 0 && (
            <div className="image-preview-grid" aria-label="Selected complaint photos">
              {previews.map(({ file, url }, index) => (
                <div className="image-preview" key={`${file.name}-${file.lastModified}-${index}`}>
                  <img src={url} alt={`Selected evidence ${index + 1}`} />
                  <div className="image-preview-footer">
                    <span title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="create-complaint-footer">
          <p>
            Category, priority, AI summary, department, and officer assignment are determined by the CivicAI backend after submission.
          </p>
          <Button type="submit" loading={isSubmitting}>
            Submit complaint
          </Button>
        </div>
      </form>
    </section>
  )
}
