import {useCallback, useEffect, useRef, useState} from 'react'
import {convertPhraseEmbedsInBody} from '@site/lib/portableTextEmbeds'
import {createRevision, patchDocument, publishDocument, query} from '../api'
import {orderForTitle, parseUnitNumber, slugify} from '../slugify'
import {postWritePayload} from './payload'
import type {PostDoc, References, SaveStatus} from './types'

const AUTOSAVE_MS = 2000
const REVISION_MS = 5 * 60 * 1000

export function useDocumentEditor(id: string) {
  const [post, setPost] = useState<PostDoc | null>(null)
  const [refs, setRefs] = useState<References | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const slugLocked = useRef(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const lastRevision = useRef(0)
  const latest = useRef<PostDoc | null>(null)
  const dirty = useRef(false)
  const convertedOnLoad = useRef<string | null>(null)

  useEffect(() => {
    latest.current = post
  }, [post])

  useEffect(() => {
    void Promise.all([query<PostDoc>('post', {id}), query<References>('references')])
      .then(([doc, referenceData]) => {
        setPost(doc)
        setRefs(referenceData)
        slugLocked.current = Boolean(doc?.slug && doc.slug !== slugify(doc.title || ''))
        setStatus('idle')
      })
      .catch((err: Error) => {
        setError(err.message)
        setStatus('error')
      })
  }, [id])

  const persist = useCallback(async (next: PostDoc, label = 'Autosave') => {
    setStatus('saving')
    setError('')
    try {
      const payload = postWritePayload(next)
      await patchDocument(next._id, 'unit', payload)
      dirty.current = false
      setStatus('saved')
      const now = Date.now()
      if (now - lastRevision.current >= REVISION_MS || label !== 'Autosave') {
        lastRevision.current = now
        await createRevision(next._id, payload, label).catch(() => undefined)
      }
    } catch (err) {
      dirty.current = true
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Save failed')
      throw err
    }
  }, [])

  const queueSave = useCallback(
    (next: PostDoc) => {
      dirty.current = true
      setStatus('unsaved')
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void persist(next).catch(() => undefined)
      }, AUTOSAVE_MS)
    },
    [persist],
  )

  const update = useCallback(
    (patch: Partial<PostDoc>) => {
      setPost((current) => {
        if (!current) return current
        const next = {...current, ...patch}
        queueSave(next)
        return next
      })
    },
    [queueSave],
  )

  const updateTitle = useCallback(
    (title: string) => {
      const unitNumber = parseUnitNumber(title)
      setPost((current) => {
        if (!current) return current
        const next = {
          ...current,
          title,
          unitNumber,
          order: orderForTitle(title),
          slug: slugLocked.current ? current.slug : slugify(title),
        }
        queueSave(next)
        return next
      })
    },
    [queueSave],
  )

  const lockSlug = useCallback((slug: string) => {
    slugLocked.current = true
    update({slug})
  }, [update])

  const saveNow = useCallback(async (label = 'Manual save') => {
    window.clearTimeout(saveTimer.current)
    const current = latest.current
    if (!current) return
    await persist(current, label)
  }, [persist])

  const publish = useCallback(
    async (nextStatus: 'draft' | 'published' | 'scheduled') => {
      const current = latest.current
      if (!current) return
      await saveNow('Pre-publish')
      const result = await publishDocument(current._id, nextStatus, current.publishedAt, {
        scheduledAt: current.scheduledAt,
        visibility: current.visibility,
      })
      update({
        status: nextStatus === 'scheduled' && current.scheduledAt && current.scheduledAt > new Date().toISOString()
          ? 'scheduled'
          : nextStatus === 'draft'
            ? 'draft'
            : 'published',
        publishedAt: nextStatus === 'published' ? current.publishedAt || new Date().toISOString() : current.publishedAt,
      })
      return result
    },
    [saveNow, update],
  )

  const retry = useCallback(() => {
    const current = latest.current
    if (!current) return
    void persist(current).catch(() => undefined)
  }, [persist])

  const reload = useCallback(async () => {
    const doc = await query<PostDoc>('post', {id})
    setPost(doc)
    setStatus('saved')
  }, [id])

  const refreshRefs = useCallback(async () => {
    const referenceData = await query<References>('references')
    setRefs(referenceData)
    return referenceData
  }, [])

  useEffect(() => {
    if (!post?.body || convertedOnLoad.current === post._id) return
    convertedOnLoad.current = post._id
    const converted = convertPhraseEmbedsInBody(post.body as import('@site/lib/portableTextEmbeds').PortableTextBodyItem[])
    if (!converted || JSON.stringify(converted) === JSON.stringify(post.body)) return
    update({body: converted as PostDoc['body']})
  }, [post?._id, post?.body, update])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.current && status !== 'unsaved' && status !== 'saving') return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  return {
    post,
    refs,
    status,
    error,
    setError,
    update,
    updateTitle,
    lockSlug,
    saveNow,
    publish,
    retry,
    reload,
    refreshRefs,
    setPost,
  }
}
