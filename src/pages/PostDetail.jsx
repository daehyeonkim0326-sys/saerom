import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, House, Pencil, Send, Trash2 } from 'lucide-react'
import ImageSlider from '../component/common/ImageSlider'
import { deletePostImages, fetchPost, removePost } from '../data/posts'
import { supabase } from '../lib/supabase.js'

const PostDetail = ({ isAdmin }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = location.state?.from || '/'
  const isFromList = returnPath.startsWith('/category/') || returnPath === '/my-posts'
  const [isClosing, setIsClosing] = useState(false)
  const [post, setPost] = useState(null)
  const [isPostLoading, setIsPostLoading] = useState(true)
  const [canManagePost, setCanManagePost] = useState(false)
  const [ownerActionError, setOwnerActionError] = useState('')
  const [adminAnswer, setAdminAnswer] = useState('')
  const [answerDraft, setAnswerDraft] = useState('')
  const [isAnswerLoading, setIsAnswerLoading] = useState(false)
  const [isAnswerSaving, setIsAnswerSaving] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const canHaveAdminAnswer = post?.category === '후기'

  useEffect(() => {
    let isMounted = true
    const loadPostAndOwner = async () => {
      if (!supabase) {
        if (isMounted) setIsPostLoading(false)
        setCanManagePost(false)
        return
      }

      try {
        const [found, { data: { user }, error }] = await Promise.all([
          fetchPost(id),
          supabase.auth.getUser(),
        ])
        if (!isMounted) return
        setPost(found)
        setCanManagePost(!error && Boolean(user) && (user.id === found?.authorId || isAdmin))
      } catch (error) {
        console.error('게시물을 불러오지 못했습니다.', error)
        if (isMounted) setPost(null)
      } finally {
        if (isMounted) setIsPostLoading(false)
      }
    }

    loadPostAndOwner()
    return () => {
      isMounted = false
    }
  }, [id, isAdmin])

  useEffect(() => {
    if (!canHaveAdminAnswer) return undefined

    let isMounted = true
    const loadAdminAnswer = async () => {
      if (!supabase) {
        return
      }

      setIsAnswerLoading(true)
      const { data, error } = await supabase
        .from('post_answers')
        .select('answer')
        .eq('post_id', String(id))
        .maybeSingle()

      if (!isMounted) return
      if (error) {
        setAdminAnswer('')
        setAnswerDraft('')
      } else {
        const savedAnswer = data?.answer || ''
        setAdminAnswer(savedAnswer)
        setAnswerDraft(savedAnswer)
      }
      setIsAnswerLoading(false)
    }

    loadAdminAnswer()
    return () => {
      isMounted = false
    }
  }, [canHaveAdminAnswer, id])

  const handleSaveAnswer = async (event) => {
    event.preventDefault()
    const answer = answerDraft.trim()
    if (!answer || !supabase) return

    setIsAnswerSaving(true)
    setAnswerError('')
    const { error } = await supabase.from('post_answers').upsert(
      { post_id: String(id), answer, updated_at: new Date().toISOString() },
      { onConflict: 'post_id' },
    )

    if (error) {
      setAnswerError('답변을 저장하지 못했습니다. 관리자 권한과 RLS 설정을 확인해 주세요.')
    } else {
      setAdminAnswer(answer)
    }
    setIsAnswerSaving(false)
  }

  const handleBack = () => {
    setIsClosing(true)
    setTimeout(() => {
      navigate(returnPath)
    }, 260)
  }

  const handleDeletePost = async () => {
    setOwnerActionError('')
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || !post || (post.authorId !== user.id && !isAdmin)) {
      setOwnerActionError('게시물을 삭제할 권한이 없습니다.')
      return
    }

    try {
      await removePost(id)
      if (post.imagePaths?.length) {
        try {
          await deletePostImages(post.imagePaths)
        } catch (imageError) {
          console.error('게시물 사진을 삭제하지 못했습니다.', imageError)
        }
      }
    } catch (deleteError) {
      console.error('게시물을 삭제하지 못했습니다.', deleteError)
      setOwnerActionError('게시물을 삭제하지 못했습니다. 권한과 서버 설정을 확인해 주세요.')
      return
    }
    navigate(returnPath, { replace: true })
  }

  if (isPostLoading) {
    return <main style={{ padding: '48px 24px', textAlign: 'center' }}>게시물을 불러오는 중입니다.</main>
  }

  if (!post) {
    return (
      <main style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2>존재하지 않는 게시물입니다.</h2>
        <button
          type='button'
          onClick={() => navigate(returnPath)}
          style={{
            background: 'none',
            border: 'none',
            color: '#1f2937',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isFromList ? '뒤로 가기' : '홈으로 돌아가기'}
        </button>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          background: '#fff',
          boxShadow: '0 -12px 30px rgba(15, 23, 42, 0.08)',
          animation: isClosing
            ? 'page-float-down 0.35s ease-in forwards'
            : 'page-float-up 0.45s ease-out both',
          padding: '24px 0 60px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px)' }}>
          <div className='detail-toolbar'>
            <button
              type='button'
              onClick={handleBack}
              className='detail-back-button'
            >
              {isFromList ? (
                <ArrowLeft size={18} aria-hidden='true' />
              ) : (
                <span className='detail-back-button__icon' aria-hidden='true'>
                  <House className='detail-back-button__house' size={18} />
                  <ArrowLeft className='detail-back-button__arrow' size={18} />
                </span>
              )}
              <span>{isFromList ? '뒤로' : '홈으로'}</span>
            </button>
            {canManagePost && (
              <div className='detail-owner-actions'>
                <Link
                  className='detail-owner-action'
                  to={`/edit/${post.id}`}
                  state={{ from: returnPath }}
                >
                  <Pencil size={15} aria-hidden='true' />
                  수정
                </Link>
                <button
                  className='detail-owner-action detail-owner-action--delete'
                  type='button'
                  onClick={handleDeletePost}
                >
                  <Trash2 size={15} aria-hidden='true' />
                  삭제
                </button>
              </div>
            )}
          </div>
          {ownerActionError && <p className='detail-owner-error' role='alert'>{ownerActionError}</p>}

          {post.images?.length > 0 && <div className='post-detail__images'><ImageSlider images={post.images} title={post.title} detail transitionName={`post-image-${post.id}`} /></div>}

          <div style={{ paddingTop: '28px', textAlign: 'left' }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 40px)', textAlign: 'left' }}>{post.title}</h1>
            <p style={{
              margin: 0,
              fontSize: '18px',
              lineHeight: 1.8,
              color: '#444',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}>
              {post.description}
            </p>
          </div>

          {canHaveAdminAnswer && (
            <section className='post-answer' aria-label='운영자 답변'>
              {(adminAnswer || isAdmin || isAnswerLoading) && (
                <div className='post-answer__heading'>
                  <span>SAEROM RESPONSE</span>
                  <h2>운영자 답변</h2>
                </div>
              )}

              {isAnswerLoading ? (
                <p className='post-answer__status' role='status'>답변을 불러오는 중입니다.</p>
              ) : adminAnswer ? (
                <p className='post-answer__content'>{adminAnswer}</p>
              ) : (
                <p className='post-answer__status'>등록된 답변이 없습니다.</p>
              )}

              {isAdmin && (
                <form className='post-answer__form' onSubmit={handleSaveAnswer}>
                  <label htmlFor='post-admin-answer'>답변 작성</label>
                  <textarea
                    id='post-admin-answer'
                    value={answerDraft}
                    onChange={(event) => setAnswerDraft(event.target.value)}
                    placeholder='게시물에 대한 답변을 작성하세요'
                    rows={4}
                    required
                  />
                  {answerError && <p className='post-answer__error' role='alert'>{answerError}</p>}
                  <button type='submit' disabled={isAnswerSaving || isAnswerLoading}>
                    <Send size={15} aria-hidden='true' />
                    {isAnswerSaving ? '저장 중...' : adminAnswer ? '답변 수정' : '답변 등록'}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>

      <style>{`
        .detail-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .post-detail__images {
          width: 100%;
        }

        .detail-back-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0;
          border: 0;
          background: none;
          color: #1f2937;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .detail-back-button:hover {
          opacity: 1;
          transform: translateX(-2px);
        }

        .detail-owner-actions {
          display: flex;
          gap: 8px;
        }

        .detail-owner-action {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #fff;
          color: #374151;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }

        .detail-owner-action:hover,
        .detail-owner-action:focus-visible {
          border-color: transparent;
          outline: none;
          background: rgba(148, 163, 184, 0.14);
          color: #1a3ac6;
        }

        .detail-owner-action--delete:hover,
        .detail-owner-action--delete:focus-visible {
          background: #fff1f0;
          color: #b42318;
        }

        @media (max-width: 560px) {
          .detail-toolbar {
            gap: 10px;
            margin-bottom: 14px;
          }

          .detail-owner-actions {
            gap: 6px;
          }

          .detail-owner-action {
            min-height: 34px;
            gap: 4px;
            padding: 0 9px;
            font-size: 12px;
          }
        }

        .detail-owner-error {
          margin: -10px 0 16px;
          color: #b42318;
          font-size: 13px;
        }

        .detail-back-button__icon {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .detail-back-button__icon svg {
          position: absolute;
          inset: 0;
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .detail-back-button__house {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        .detail-back-button__arrow {
          opacity: 0;
          transform: rotate(-360deg) scale(0.55);
        }

        .detail-back-button:hover .detail-back-button__house {
          opacity: 0;
          transform: rotate(360deg) scale(0.55);
        }

        .detail-back-button:hover .detail-back-button__arrow {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        .post-answer {
          margin-top: 40px;
          padding: 24px;
          border-left: 3px solid #3b34c8;
          background: #f3f4f6;
        }

        .post-answer__heading span {
          color: #3b34c8;
          font-size: 11px;
          font-weight: 800;
        }

        .post-answer__heading h2 {
          margin: 6px 0 16px;
          color: #202336;
          font-size: 20px;
        }

        .post-answer__content,
        .post-answer__status {
          margin: 0;
          color: #4b5563;
          font-size: 15px;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .post-answer__form {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
        }

        .post-answer__form label {
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .post-answer__form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font: inherit;
          resize: vertical;
        }

        .post-answer__form button {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          gap: 7px;
          padding: 0 14px;
          border: 0;
          border-radius: 999px;
          background: #3b34c8;
          color: #fff;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .post-answer__form button:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .post-answer__error {
          margin: 0;
          color: #b42318;
          font-size: 13px;
        }

        @media (prefers-reduced-motion: reduce) {
          .detail-back-button__icon svg {
            transition: none;
          }
        }

      `}</style>
    </main>
  )
}

export default PostDetail
