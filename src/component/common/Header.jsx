import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import './Header.scss'
import logo from '../../assets/img/logo.svg'
import { POST_CATEGORIES } from '../../data/posts.js'

const Header = ({ isLoggedIn, onToggleLogin }) => {
  const { pathname } = useLocation()
  const isHomePage = pathname === '/'
  const isAboutPage = pathname === '/about'
  const [isHidden, setIsHidden] = useState(false)
  const [isTransparent, setIsTransparent] = useState(
    () => isAboutPage && window.scrollY <= 8,
  )
  const [aboutBackgroundOpacity, setAboutBackgroundOpacity] = useState(
    () => (isAboutPage || isHomePage) ? Math.min(window.scrollY / 120, 1) : 1,
  )
  const isAtTransparentTop = (isHomePage || isAboutPage) && aboutBackgroundOpacity === 0
  const previousScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0)

      if (isHomePage) {
        const banner = document.querySelector('.banner')
        const isPastBanner = Boolean(banner && banner.getBoundingClientRect().bottom <= 0)
        setIsHidden(isPastBanner)
        setIsTransparent(false)
        setAboutBackgroundOpacity(Math.min(currentScrollY / 120, 1))
        previousScrollY.current = currentScrollY
        return
      }

      if (isAboutPage) {
        setIsHidden(false)
        setIsTransparent(false)
        setAboutBackgroundOpacity(Math.min(currentScrollY / 120, 1))
        previousScrollY.current = currentScrollY
        return
      }

      setIsTransparent(false)
      const scrollDifference = currentScrollY - previousScrollY.current

      if (currentScrollY <= 80) {
        setIsHidden(false)
      } else if (Math.abs(scrollDifference) > 8) {
        setIsHidden(scrollDifference > 0)
      }

      previousScrollY.current = currentScrollY
    }

    previousScrollY.current = Math.max(window.scrollY, 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAboutPage, isHomePage])

  return (
    <header
      id='header'
      style={isAboutPage || isHomePage
        ? { '--header-background-opacity': aboutBackgroundOpacity }
        : undefined}
      className={[
        isHomePage && 'header--home',
        isAboutPage && 'header--about',
        (isTransparent || isAtTransparentTop) && 'header--transparent',
        isHidden && 'header--hidden',
      ].filter(Boolean).join(' ')}
    >
      <Link to='/' className='header__brand' aria-label='새롬 메인으로 이동'>
        <img src={logo} alt='saerom' />
        <span className='header__brand-name' aria-hidden='true'>
          <span>새롬</span>
          <span>인테리어</span>
        </span>
      </Link>
      <ul>
        <li>
          <Link className='header__nav-link' to='/about'>About</Link>
        </li>
        <li className='header__dropdown'>
          <button type='button' className='header__dropdown-trigger' aria-haspopup='true'>
            Counsel
          </button>
          <div className='header__submenu' aria-label='상담 및 게시물 메뉴'>
            <Link to='/consultation'>상담 신청</Link>
            {POST_CATEGORIES.filter((category) => category !== 'Portfolio').map((category) => (
              <Link key={category} to={`/category/${category}`}>
                {category}
              </Link>
            ))}
          </div>
        </li>
        <li><Link className='header__nav-link' to='/category/Portfolio'>Portfolio</Link></li>
      </ul>

      <div className='header__actions'>
        {isLoggedIn && (
          <Link
            to='/mypage'
            className='header__profile'
            aria-label='마이페이지'
            title='마이페이지'
          >
            <UserRound size={19} strokeWidth={2} aria-hidden='true' />
          </Link>
        )}
        <button type='button' className='header__login' onClick={onToggleLogin}>
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>
      </div>
    </header>
  )
}

export default Header