import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Main.scss'
import { fetchPosts } from '../../data/posts'

const PostCards = ({ posts, emptyMessage }) => (
  posts.length ? (
    <div className='home-posts__grid'>
      {posts.map((post) => (
        <Link key={post.id} className='home-post-card' to={`/post/${post.id}`}>
          {post.image
            ? <img src={post.image} alt='' />
            : <div className='home-post-card__placeholder'>{post.category}</div>}
          <div className='home-post-card__body'>
            <span>{post.category}</span>
            <h3>{post.title}</h3>
            {post.description && <p>{post.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  ) : <p className='home-posts__empty'>{emptyMessage}</p>
)

const Main = () => {
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [homePosts, setHomePosts] = useState([])
  const [current, setCurrent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchPosts({ featuredOnly: true }),
      fetchPosts({ categories: ['후기', '공지'] }),
    ])
      .then(([featured, homepage]) => {
        if (!isMounted) return
        setFeaturedPosts(featured)
        setHomePosts(homepage)
        setCurrent(0)
      })
      .catch((error) => {
        console.error('홈 게시물을 불러오지 못했습니다.', error)
        if (isMounted) setLoadError('게시물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (featuredPosts.length < 2) return undefined
    const timer = setInterval(() => {
      setCurrent((previous) => (previous + 1) % featuredPosts.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [featuredPosts.length])

  const reviewPosts = homePosts.filter((post) => post.category === '후기')
  const noticePosts = homePosts.filter((post) => post.category === '공지')

  return (
    <main className='main'>
      <section className='banner' aria-label='관리자 추천 포트폴리오'>
        {isLoading ? (
          <div className='banner__empty' role='status'>게시물을 불러오는 중입니다.</div>
        ) : loadError ? (
          <div className='banner__empty' role='alert'>{loadError}</div>
        ) : featuredPosts.length ? (
          <>
            <div
              className='banner__track'
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {featuredPosts.map((slide) => (
                <div key={slide.id} className='banner__slide'>
                  <div className='banner__bg' style={{ backgroundImage: `url(${slide.image})` }} />
                  <Link to={`/post/${slide.id}`} className='banner__link'>
                    <img className='banner__image' src={slide.image} alt={slide.title} />
                  </Link>
                </div>
              ))}
            </div>
            {featuredPosts.length > 1 && (
              <div className='banner__dots' aria-label='슬라이드 선택'>
                {featuredPosts.map((slide, index) => (
                  <button
                    key={slide.id}
                    type='button'
                    className={`banner__dot ${index === current ? 'active' : ''}`}
                    aria-label={`${index + 1}번 슬라이드 보기`}
                    aria-current={index === current ? 'true' : undefined}
                    onClick={() => setCurrent(index)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className='banner__empty'>관리자가 이미지를 포함한 게시물을 등록하면 이곳에 소개됩니다.</div>
        )}
      </section>

      <div className='home-posts'>
        <section className='home-posts__section'>
          <header>
            <div>
              <p>SAEROM STORIES</p>
              <h2>시공 후기</h2>
            </div>
            <Link to='/category/후기'>후기 더보기</Link>
          </header>
          {loadError
            ? <p className='home-posts__empty' role='alert'>{loadError}</p>
            : <PostCards posts={reviewPosts.slice(0, 4)} emptyMessage='등록된 후기가 없습니다.' />}
        </section>

        <section className='home-posts__section home-posts__section--notices'>
          <header>
            <div>
              <p>NOTICE</p>
              <h2>공지사항</h2>
            </div>
            <Link to='/category/공지'>공지 더보기</Link>
          </header>
          {loadError
            ? <p className='home-posts__empty' role='alert'>{loadError}</p>
            : <PostCards posts={noticePosts.slice(0, 4)} emptyMessage='등록된 공지사항이 없습니다.' />}
        </section>
      </div>
    </main>
  )
}

export default Main
