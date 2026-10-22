import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import ImageSlider from '../component/common/ImageSlider'
import { ADMIN_ONLY_CATEGORIES, fetchPosts, POST_CATEGORIES } from '../data/posts'
import './CategoryPosts.scss'

const CategoryPosts = ({ isLoggedIn, isAdmin }) => {
  const { category } = useParams()
  const location = useLocation()
  const isValidCategory = POST_CATEGORIES.includes(category)
  const canWrite = isLoggedIn && (isAdmin || !ADMIN_ONLY_CATEGORIES.includes(category))
  const [result, setResult] = useState({ category: null, posts: [], error: '' })
  const isLoading = result.category !== category
  const posts = isLoading ? [] : result.posts
  const errorMessage = isLoading ? '' : result.error

  useEffect(() => {
    let isMounted = true
    fetchPosts({ category })
      .then((loadedPosts) => {
        if (isMounted) setResult({ category, posts: loadedPosts, error: '' })
      })
      .catch((error) => {
        console.error('게시물을 불러오지 못했습니다.', error)
        if (isMounted) setResult({
          category,
          posts: [],
          error: '게시물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      })

    return () => {
      isMounted = false
    }
  }, [category])

  return (
    <main className='category-page'>
      <header className='category-page__heading'>
        <div>
          <p>
            {category === 'Portfolio'
              ? 'PORTFOLIO'
              : isValidCategory ? `COUNSEL / ${category}` : 'COUNSEL'}
          </p>
          <h1>{isValidCategory ? category : '카테고리를 찾을 수 없습니다'}</h1>
          {category === 'Portfolio' && <span>나만의 가치를 녹여내는 공간을 만듭니다</span>}
        </div>
        {isValidCategory && canWrite && (
          <Link className='category-page__write' to='/write' state={{ category }}>
            <PenLine size={16} aria-hidden='true' />
            글쓰기
          </Link>
        )}
      </header>

      {isLoading ? (
        <p className='category-page__empty' role='status'>게시물을 불러오는 중입니다.</p>
      ) : errorMessage ? (
        <p className='category-page__empty' role='alert'>{errorMessage}</p>
      ) : posts.length > 0 ? (
        <div className='category-grid'>
          {posts.map((post) => (
            <Link
              className='category-post'
              to={`/post/${post.id}`}
              state={{ from: location.pathname }}
              viewTransition
              key={post.id}
            >
              {post.images?.length > 0 && <ImageSlider images={post.images} title={post.title} locations={category === 'Portfolio' ? post.imageLocations : []} openOnImageClick transitionName={`post-image-${post.id}`} />}
              <div className='category-post__body'>
                <span>{post.category}</span>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className='category-page__empty'>
          {isValidCategory ? '아직 등록된 게시물이 없습니다.' : '선택한 카테고리를 확인해 주세요.'}
        </p>
      )}
    </main>
  )
}

export default CategoryPosts
