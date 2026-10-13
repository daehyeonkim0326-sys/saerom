import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import './WritePost.scss'
import {
  ADMIN_ONLY_CATEGORIES,
  createPost,
  deletePostImage,
  fetchPost,
  POST_CATEGORIES,
  updatePost,
  uploadPostImage,
} from '../data/posts'
import { supabase } from '../lib/supabase.js'

const WritePost = ({ isLoggedIn, isAdmin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { postId } = useParams()
  const isEditing = Boolean(postId)
  const returnPath = location.state?.from || (isEditing ? '/my-posts' : '/')
  const availableCategories = isAdmin
    ? POST_CATEGORIES
    : POST_CATEGORIES.filter((category) => !ADMIN_ONLY_CATEGORIES.includes(category))
  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    category: availableCategories.includes(location.state?.category)
      ? location.state.category
      : isAdmin ? POST_CATEGORIES[0] : '새롬 이야기',
    image: '',
    imagePath: null,
  }))
  const [imageFile, setImageFile] = useState(null)
  const [editState, setEditState] = useState({ loading: isEditing, authorized: !isEditing })
  const [submitError, setSubmitError] = useState('')
  const imageInputRef = useRef(null)
  const originalImagePathRef = useRef(null)

  useEffect(() => {
    if (!isEditing) return undefined

    let isMounted = true
    const loadPostForEdit = async () => {
      if (!isLoggedIn || !supabase) {
        setEditState({ loading: false, authorized: false })
        return
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (!isMounted) return

      let post
      try {
        post = await fetchPost(postId)
      } catch (loadError) {
        console.error('게시물을 불러오지 못했습니다.', loadError)
      }
      const isOwner = Boolean(user && post?.authorId === user.id)
      if (
        error
        || !user
        || !post
        || (!isOwner && !isAdmin)
      ) {
        setEditState({ loading: false, authorized: false })
        return
      }

      setForm({
        title: post.title,
        description: post.description,
        category: post.category,
        image: post.image,
        imagePath: post.imagePath,
      })
      originalImagePathRef.current = post.imagePath
      setEditState({ loading: false, authorized: true })
    }

    loadPostForEdit()
    return () => {
      isMounted = false
    }
  }, [isEditing, isLoggedIn, isAdmin, postId])

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setSubmitError('사진은 JPG, PNG, WEBP, GIF 파일만 가능하며 10MB 이하여야 합니다.')
      event.target.value = ''
      return
    }

    setSubmitError('')
    setImageFile(file)
    setForm((current) => ({ ...current, image: URL.createObjectURL(file) }))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setForm((current) => ({ ...current, image: '', imagePath: null }))
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    if (!isLoggedIn || (!isAdmin && ADMIN_ONLY_CATEGORIES.includes(form.category)) || !form.title.trim()) {
      setSubmitError('로그인 상태와 게시물 정보를 확인해 주세요.')
      return
    }
    if (!supabase) {
      setSubmitError('게시물 서버 설정이 필요합니다. 관리자에게 문의해 주세요.')
      return
    }
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      setSubmitError('로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      return
    }

    let uploadedImagePath = null
    try {
      let imageOwnerId = user.id
      if (isEditing) {
        const existingPost = await fetchPost(postId)
        if (!existingPost || (existingPost.authorId !== user.id && !isAdmin)) {
          setSubmitError('이 게시물을 수정할 권한이 없습니다.')
          return
        }
        imageOwnerId = existingPost.authorId
      }

      const imagePath = imageFile
        ? await uploadPostImage(imageFile, imageOwnerId)
        : form.imagePath
      if (imageFile) uploadedImagePath = imagePath

      const postData = {
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        image_path: imagePath,
      }

      if (isEditing) {
        await updatePost(postId, postData)
        if (originalImagePathRef.current && originalImagePathRef.current !== imagePath) {
          try {
            await deletePostImage(originalImagePathRef.current)
          } catch (imageError) {
            console.error('기존 게시물 이미지를 삭제하지 못했습니다.', imageError)
          }
        }
        originalImagePathRef.current = imagePath
        navigate(returnPath)
      } else {
        const newPost = await createPost({
          ...postData,
          author_id: user.id,
          author_role: isAdmin && user.app_metadata?.role === 'admin' ? 'admin' : 'member',
        })
        navigate(`/post/${newPost.id}`, {
          state: { from: location.state?.category ? `/category/${location.state.category}` : '/' },
        })
      }
    } catch (error) {
      console.error('게시물을 저장하지 못했습니다.', error)
      if (uploadedImagePath) {
        try {
          await deletePostImage(uploadedImagePath)
        } catch (cleanupError) {
          console.error('게시물 저장 실패 후 이미지를 정리하지 못했습니다.', cleanupError)
        }
      }
      setSubmitError(
        /row-level security|permission denied/i.test(error?.message ?? '')
          ? '해당 카테고리에 글을 작성할 권한이 없습니다. 로그인과 관리자 설정을 확인해 주세요.'
          : '게시물을 저장하지 못했습니다. 네트워크와 데이터베이스 설정을 확인한 뒤 다시 시도해 주세요.',
      )
    }
  }

  if (!isLoggedIn) {
    return (
      <main className='write-page'>
        <section className='write-page__notice'>
          <h1>로그인이 필요합니다</h1>
          <p>게시물을 작성하려면 먼저 로그인해 주세요.</p>
          <Link to='/'>홈으로 돌아가기</Link>
        </section>
      </main>
    )
  }

  if (isEditing && editState.loading) {
    return <main className='write-page'><p role='status'>게시물을 불러오는 중입니다.</p></main>
  }

  if (isEditing && !editState.authorized) {
    return (
      <main className='write-page'>
        <section className='write-page__notice'>
          <h1>수정할 수 없습니다</h1>
          <p>게시물을 찾을 수 없거나 수정 권한이 없습니다.</p>
          <Link to='/my-posts'>내가 쓴 글로 돌아가기</Link>
        </section>
      </main>
    )
  }

  return (
    <main className='write-page'>
      <form className='write-form' onSubmit={handleSubmit}>
        <div className='write-form__heading'>
          <div>
            <p>{isEditing ? '게시물 관리' : '새 게시물'}</p>
            <h1>{isEditing ? '게시물 수정' : '글쓰기'}</h1>
          </div>
          <Link className='write-form__cancel' to={returnPath}>취소</Link>
        </div>

        <label>
          <span>제목</span>
          <input
            type='text'
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder='제목을 입력하세요'
            required
          />
        </label>

        <label>
          <span>카테고리</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          <span>내용</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder='게시물 내용을 입력하세요'
          />
        </label>

        <label>
          <span>{isEditing ? '사진 변경' : '사진 첨부'}</span>
          <input
            ref={imageInputRef}
            type='file'
            accept='.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif'
            onChange={handleImageUpload}
          />
        </label>

        {form.image && (
          <div className='write-form__image-preview'>
            <img className='write-form__preview' src={form.image} alt='게시물 이미지 미리보기' />
            <button
              className='write-form__image-remove'
              type='button'
              onClick={handleRemoveImage}
            >
              <Trash2 size={15} aria-hidden='true' />
              사진 제거
            </button>
          </div>
        )}

        {submitError && <p className='write-form__error' role='alert'>{submitError}</p>}
        <button className='write-form__submit' type='submit'>
          {isEditing ? '수정 완료' : '게시물 등록'}
        </button>
      </form>
    </main>
  )
}

export default WritePost