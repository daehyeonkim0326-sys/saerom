import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { deletePostImages, fetchPosts, removePost } from '../data/posts'
import { supabase } from '../lib/supabase.js'
import './MyPosts.scss'

const MyPosts = ({ isLoggedIn }) => {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const handleDelete = async (post) => {
    setErrorMessage('')
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user || post.authorId !== user.id) {
        setErrorMessage('게시물을 삭제할 권한이 없습니다.')
        return
      }

      await removePost(post.id)
      if (post.imagePaths?.length) {
        try {
          await deletePostImages(post.imagePaths)
        } catch (imageError) {
          console.error('게시물 사진을 삭제하지 못했습니다.', imageError)
        }
      }
      setPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id))
    } catch (error) {
      console.error('게시물을 삭제하지 못했습니다.', error)
      setErrorMessage('게시물을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadMyPosts = async () => {
      if (!isLoggedIn || !supabase) {
        setPosts([])
        setIsLoading(false)
        return
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (!isMounted) return

      if (error) {
        console.error('내 게시물을 불러오지 못했습니다.', error)
        setPosts([])
        setErrorMessage('내 게시물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } else {
        try {
          setPosts(await fetchPosts({ authorId: user?.id }))
        } catch (loadError) {
          console.error('내 게시물을 불러오지 못했습니다.', loadError)
          setErrorMessage('내 게시물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      }
      setIsLoading(false)
    }

    loadMyPosts()
    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <main className='my-posts-page'>
        <section className='my-posts-page__empty'>
          <h1>로그인이 필요합니다</h1>
          <p>내가 쓴 글을 보려면 먼저 로그인해 주세요.</p>
          <Link to='/'>홈으로 돌아가기</Link>
        </section>
      </main>
    )
  }

  return (
    <main className='my-posts-page'>
      <div className='my-posts-page__content'>
        <header className='my-posts-page__heading'>
          <div>
            <p>MY SAEROM</p>
            <h1>내가 쓴 글</h1>
          </div>
          <Link to='/write'>글쓰기</Link>
        </header>

        {isLoading ? (
          <p className='my-posts-page__status' role='status'>게시물을 불러오는 중입니다.</p>
        ) : posts.length ? (
          <>
            <div className='my-posts-page__list'>
              {posts.map((post) => (
                <article className='my-posts-page__post' key={post.id}>
                  {post.image && <img src={post.image} alt='' />}
                  <div className='my-posts-page__post-body'>
                    <span>{post.category}</span>
                    <div className='my-posts-page__title-row'>
                      <Link
                        className='my-posts-page__title'
                        to={`/post/${post.id}`}
                        state={{ from: '/my-posts' }}
                      >
                        <h2>{post.title}</h2>
                      </Link>
                      <div className='my-posts-page__actions'>
                        <Link
                          className='my-posts-page__action'
                          to={`/edit/${post.id}`}
                          state={{ from: '/my-posts' }}
                        >
                          <Pencil size={14} aria-hidden='true' />
                          수정
                        </Link>
                        <button
                          className='my-posts-page__action my-posts-page__action--delete'
                          type='button'
                          aria-label={`${post.title} 삭제`}
                          onClick={() => handleDelete(post)}
                        >
                          <Trash2 size={14} aria-hidden='true' />
                          삭제
                        </button>
                      </div>
                    </div>
                    <p>{post.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            {errorMessage ? (
              <p className='my-posts-page__error' role='alert'>{errorMessage}</p>
            ) : (
              <section className='my-posts-page__empty'>
                <h2>아직 작성한 글이 없습니다</h2>
                <p>첫 게시물을 작성해 보세요.</p>
                <Link to='/write'>글쓰기</Link>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default MyPosts